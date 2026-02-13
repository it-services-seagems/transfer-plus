# ========================================
# 🖼️ ROTAS ATUALIZADAS PARA TABELA CENTRALIZADA DE IMAGENS
# ========================================
# Este arquivo contém as rotas atualizadas para usar a nova tabela 'imagens'
# Cole estas funções no lugar das antigas no Api.py

@app.route("/api/conferencia/upload", methods=["POST"])
def upload_imagem_embarque():
    """Upload de imagem - Salva na tabela centralizada 'imagens'."""
    print(f"🔍 Content-Type: {request.content_type}")
    print(f"🔍 Form data: {dict(request.form)}")
    print(f"🔍 Files: {dict(request.files)}")

    is_auth, error_msg = verify_authentication()
    if not is_auth:
        return jsonify({"status": "error", "message": error_msg}), 401

    try:
        id_registro = request.form.get("id_embarque") or request.form.get("id")
        arquivo = request.files.get("arquivo") or request.files.get("image")
        username = request.headers.get('x-user-name') or request.headers.get('X-User-Name')

        if not id_registro:
            return jsonify({"status": "error", "message": "ID do registro obrigatório"}), 400
        if not arquivo or not arquivo.filename:
            return jsonify({"status": "error", "message": "Arquivo de imagem obrigatório"}), 400

        original_basename = secure_filename(os.path.splitext(arquivo.filename)[0])
        _, ext = os.path.splitext(arquivo.filename)
        ext = ext.lower() or ".jpg"

        if ext not in [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]:
            return jsonify({"status": "error", "message": "Formato de imagem inválido"}), 400

        # Ler bytes da imagem
        imagem_bytes = arquivo.read()
        file_size = len(imagem_bytes)
        
        # Detectar content type
        content_type = arquivo.content_type or f"image/{ext.lstrip('.')}"
        
        # Gerar nome de arquivo único
        unique_filename = f"{original_basename}__{str(id_registro)}__{int(time.time())}{ext}"

        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "Erro ao conectar ao banco"}), 500
        cursor = conn.cursor()

        # Verificar se já existe imagem para este ID (UPSERT)
        cursor.execute("SELECT COUNT(1) FROM imagens WHERE id = ?", (id_registro,))
        exists = cursor.fetchone()[0]

        if exists:
            # UPDATE
            update_query = """
                UPDATE imagens 
                SET image_bin = ?, 
                    image_name = ?, 
                    content_type = ?, 
                    file_size = ?, 
                    uploaded_at = GETDATE(),
                    uploaded_by = ?
                WHERE id = ?
            """
            cursor.execute(update_query, (imagem_bytes, unique_filename, content_type, file_size, username, id_registro))
            print(f"✅ Imagem atualizada na tabela 'imagens' para id={id_registro}")
        else:
            # INSERT - Detectar tabela de origem
            cursor.execute("SELECT COUNT(1) FROM embarque WHERE id = ?", (id_registro,))
            is_embarque = cursor.fetchone()[0] > 0
            cursor.execute("SELECT COUNT(1) FROM conferencia WHERE id = ?", (id_registro,))
            is_conferencia = cursor.fetchone()[0] > 0
            
            source_table = 'embarque' if is_embarque else ('conferencia' if is_conferencia else 'desembarque')
            
            insert_query = """
                INSERT INTO imagens (id, image_bin, image_name, content_type, file_size, uploaded_by, source_table)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            cursor.execute(insert_query, (id_registro, imagem_bytes, unique_filename, content_type, file_size, username, source_table))
            print(f"✅ Imagem inserida na tabela 'imagens' para id={id_registro} (source={source_table})")

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Imagem salva com sucesso na tabela centralizada.",
            "filename": unique_filename,
            "id": id_registro
        }), 200

    except Exception as e:
        print(f"❌ Erro no upload: {e}")
        try:
            conn = get_sql_connection()
            if conn:
                conn.rollback()
        except:
            pass
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/embarque/imagem/<path:id>", methods=["GET", "OPTIONS"])
@cross_origin(
    origins="*",
    allow_headers=["x-user-name", "x-user-type", "Content-Type", "Authorization"],
    supports_credentials=True
)
def visualizar_imagem_embarque(id):
    """Visualizar imagem - Busca na tabela centralizada 'imagens'."""

    print(f"\n{'='*80}")
    print(f"[🖼️ DEBUG IMAGE] Tentativa de visualizar imagem ID: {id}")
    print(f"{'='*80}")

    # Verificar autenticação
    try:
        auth_res = verify_authentication()
    except Exception as e:
        print(f"[❌ DEBUG] Erro ao verificar autenticação: {e}")
        auth_res = None

    if not auth_res:
        print(f"[❌ DEBUG] Falha na autenticação para requisição de imagem: {id}")
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    print(f"[✅ DEBUG] Autenticação OK para imagem {id}")

    try:
        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "DB connection failed"}), 500

        cursor = conn.cursor()
        
        # Buscar na tabela centralizada 'imagens'
        print(f"[🔎 DEBUG] Buscando na tabela centralizada 'imagens'...")
        cursor.execute("""
            SELECT image_bin, image_name, content_type 
            FROM imagens 
            WHERE id = ?
        """, (id,))
        
        row = cursor.fetchone()
        
        if row and row[0]:
            image_bin = row[0]
            image_name = row[1]
            content_type = row[2] or "image/jpeg"
            
            print(f"[✅ DEBUG] IMAGEM ENCONTRADA!")
            print(f"[✅ DEBUG] - Nome: {image_name}")
            print(f"[✅ DEBUG] - Content-Type: {content_type}")
            print(f"[✅ DEBUG] - Tamanho: {len(image_bin) / 1024:.2f} KB")
            print(f"{'='*80}\n")
            
            cursor.close()
            conn.close()
            
            response = make_response(image_bin)
            response.headers['Content-Type'] = content_type
            response.headers['Cache-Control'] = 'public, max-age=3600'
            return response
        else:
            print(f"[❌ DEBUG] IMAGEM NÃO ENCONTRADA PARA ID: {id}")
            print(f"{'='*80}\n")
            
            cursor.close()
            conn.close()
            
            return jsonify({"status": "error", "message": "Imagem não encontrada"}), 404

    except Exception as e:
        print(f"[❌ DEBUG] Erro ao buscar imagem: {e}")
        traceback.print_exc()
        try:
            conn.close()
        except:
            pass
        return jsonify({"status": "error", "message": "Erro interno"}), 500


@app.route("/api/embarque/imagem/", methods=["GET", "OPTIONS"])
@cross_origin(
    origins="*",
    allow_headers=["x-user-name", "x-user-type", "Content-Type", "Authorization"],
    supports_credentials=True
)
def visualizar_imagem_embarque_query():
    """Compatibilidade: permite chamar /api/embarque/imagem?id=123"""
    print("[🖼️ DEBUG] Requisição para /api/embarque/imagem/ com query string")
    
    id_qs = request.args.get('id') or request.args.get('imageId') or request.args.get('arquivo') or request.args.get('filename')

    if not id_qs:
        print(f"[⚠️ DEBUG] Requisição sem id (query string: {request.query_string})")
        
        # Tentar extrair do Referer
        referer = request.headers.get('Referer') or request.headers.get('referer')
        if referer:
            try:
                import re
                m = re.search(r'[?&]id=([^&]+)', referer)
                if m:
                    id_qs = m.group(1)
                    print(f"[✅ DEBUG] ID extraído do Referer: {id_qs}")
                else:
                    m = re.search(r'/(\d+)/?$', referer)
                    if m:
                        id_qs = m.group(1)
                        print(f"[✅ DEBUG] ID extraído do path no Referer: {id_qs}")
            except Exception as e:
                print(f"[⚠️ DEBUG] Erro ao analisar Referer: {e}")

    # Tentar buscar último upload do usuário
    if not id_qs:
        try:
            username = request.headers.get('x-user-name') or request.headers.get('X-User-Name')
            print(f"[🔍 DEBUG] Tentando localizar último ID com imagem para user: {username}")
            conn = get_sql_connection()
            if conn:
                cur = conn.cursor()

                if username:
                    cur.execute(
                        "SELECT TOP 1 id FROM imagens WHERE uploaded_by = ? ORDER BY uploaded_at DESC",
                        (username,)
                    )
                else:
                    cur.execute("SELECT TOP 1 id FROM imagens ORDER BY uploaded_at DESC")

                row = cur.fetchone()
                if row and row[0]:
                    id_qs = str(row[0])
                    print(f"[✅ DEBUG] ID inferido do último upload: {id_qs}")
                else:
                    print(f"[⚠️ DEBUG] Nenhum registro encontrado")

                try:
                    cur.close()
                    conn.close()
                except Exception:
                    pass

        except Exception as e:
            print(f"[⚠️ DEBUG] Erro ao consultar DB para id fallback: {e}")

    if not id_qs:
        print(f"[❌ DEBUG] Não foi possível inferir ID da imagem; retornando 400")
        return jsonify({"status": "error", "message": "ID da imagem obrigatório. Use /api/embarque/imagem/<id> ou /api/embarque/imagem?id=<id>"}), 400

    # Delegar para a função existente
    return visualizar_imagem_embarque(id_qs)


@app.route('/api/embarque/metadata/<path:id>', methods=['GET'])
def embarque_image_metadata(id):
    """Retorna metadata da imagem da tabela centralizada 'imagens'."""
    try:
        print(f"[🗂️ DEBUG] Requisição metadata imagem para id: {id}")
        
        auth_res = verify_authentication()
        if not auth_res:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "DB connection failed"}), 500
        cursor = conn.cursor()

        # Buscar na tabela centralizada
        cursor.execute("""
            SELECT image_name, content_type, file_size, uploaded_at, source_table
            FROM imagens 
            WHERE id = ?
        """, (id,))
        row = cursor.fetchone()
        
        if row:
            metadata = {
                "status": "success",
                "file": str(row[0]) if row[0] else None,
                "content_type": str(row[1]) if row[1] else None,
                "file_size": row[2],
                "uploaded_at": str(row[3]) if row[3] else None,
                "source_table": str(row[4]) if row[4] else None
            }
            cursor.close()
            conn.close()
            print(f"[🗂️ DEBUG] Metadata encontrada: {metadata['file']}")
            return jsonify(metadata), 200
        else:
            cursor.close()
            conn.close()
            print(f"[🗂️ DEBUG] Metadata não encontrada para id: {id}")
            return jsonify({"status": "error", "message": "Metadata not found"}), 404

    except Exception as e:
        print(f"[❌ DEBUG] Erro: {str(e)}")
        traceback.print_exc()
        try:
            conn.close()
        except:
            pass
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/debug/image_status/<path:id>', methods=['GET'])
def debug_image_status(id):
    """Debug: verificar status de uma imagem na tabela centralizada"""
    try:
        auth_res = verify_authentication()
        if not auth_res:
            return jsonify({"status": "error", "message": "Unauthorized"}), 401

        conn = get_sql_connection()
        if not conn:
            return jsonify({"status": "error", "message": "DB connection failed"}), 500
        cursor = conn.cursor()

        # Verificar na tabela imagens
        cursor.execute("""
            SELECT 
                id, 
                image_name, 
                content_type,
                file_size,
                uploaded_at,
                uploaded_by,
                source_table,
                CASE WHEN image_bin IS NULL THEN 0 ELSE 1 END as has_blob
            FROM imagens 
            WHERE id = ?
        """, (id,))
        
        row = cursor.fetchone()
        
        if row:
            result = {
                "status": "success",
                "found": True,
                "id": row[0],
                "image_name": row[1],
                "content_type": row[2],
                "file_size": row[3],
                "uploaded_at": str(row[4]) if row[4] else None,
                "uploaded_by": row[5],
                "source_table": row[6],
                "has_blob": bool(row[7])
            }
        else:
            result = {
                "status": "success",
                "found": False,
                "message": f"Imagem não encontrada para ID: {id}"
            }
        
        cursor.close()
        conn.close()
        
        return jsonify(result), 200

    except Exception as e:
        print(f"[❌ DEBUG] Erro: {str(e)}")
        traceback.print_exc()
        try:
            conn.close()
        except:
            pass
        return jsonify({"status": "error", "message": str(e)}), 500
