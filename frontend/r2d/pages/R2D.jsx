import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/r2d.css';

export default function R2D() {
  const [registros, setRegistros] = useState([]);
  const [paginacao, setPaginacao] = useState({
    pagina_atual: 1,
    limite_por_pagina: 10,
    total_registros: 0,
    total_paginas: 0,
    tem_proxima: false,
    tem_anterior: false,
    inicio_registro: 0,
    fim_registro: 0
  });
  const [filtros, setFiltros] = useState({
    data_inicio: '2025-01-01',
    data_fim: '2026-01-01'
  });
  const [carregando, setCarregando] = useState(false);
  const [visualizacao, setVisualizacao] = useState('cards');

  const API_BASE_URL = 'http://10.15.3.30:9280';

  const buscarRegistros = async (pagina = 1) => {
    setCarregando(true);
    try {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');

      const resposta = await axios.get(`${API_BASE_URL}/api/R2D/consulta`, {
        params: {
          data_inicio: filtros.data_inicio,
          data_fim: filtros.data_fim,
          pagina: pagina,
          limite: 10
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-Type': 'ADMIN',
          'X-User-Name': username,
          'Content-Type': 'application/json'
        }
      });

      if (resposta.data.sucesso) {
        setRegistros(resposta.data.dados);
        setPaginacao(resposta.data.paginacao);
      }
    } catch (erro) {
      console.error('Erro ao buscar registros:', erro);
      alert('Erro ao buscar registros: ' + erro.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarRegistros(1);
  }, []);

  const handleBuscar = () => {
    buscarRegistros(1);
  };

  const handleLimpar = () => {
    setFiltros({
      data_inicio: '2025-01-01',
      data_fim: '2026-01-01'
    });
  };

  const proximaPagina = () => {
    if (paginacao.tem_proxima) {
      buscarRegistros(paginacao.pagina_atual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const paginaAnterior = () => {
    if (paginacao.tem_anterior) {
      buscarRegistros(paginacao.pagina_atual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const irParaPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= paginacao.total_paginas) {
      buscarRegistros(novaPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="r2d-container">
      <h1>R2D - Requisição de Compra vs PO</h1>

      {/* FILTROS */}
      <div className="filtros-section">
        <div className="filtro-grupo">
          <label>DATA INÍCIO (CRIAÇÃO PO)</label>
          <input
            type="date"
            value={filtros.data_inicio}
            onChange={(e) => setFiltros({ ...filtros, data_inicio: e.target.value })}
          />
        </div>

        <div className="filtro-grupo">
          <label>DATA FIM (CRIAÇÃO PO)</label>
          <input
            type="date"
            value={filtros.data_fim}
            onChange={(e) => setFiltros({ ...filtros, data_fim: e.target.value })}
          />
        </div>

        <div className="botoes-filtro">
          <button className="btn-buscar" onClick={handleBuscar} disabled={carregando}>
            {carregando ? 'Buscando...' : 'Buscar'}
          </button>
          <button className="btn-limpar" onClick={handleLimpar}>Limpar</button>
        </div>
      </div>

      {/* RESULTADO E VISUALIZAÇÃO */}
      <div className="resultado-header">
        <h2>
          Resultados da Busca ({paginacao.total_registros} registro(s) encontrado(s))
        </h2>
        
        <div className="visualizacao-botoes">
          <button 
            className={visualizacao === 'cards' ? 'ativo' : ''}
            onClick={() => setVisualizacao('cards')}
          >
            Cards
          </button>
          <button 
            className={visualizacao === 'tabela' ? 'ativo' : ''}
            onClick={() => setVisualizacao('tabela')}
          >
            Tabela
          </button>
        </div>
      </div>

      {/* CONTEÚDO */}
      {carregando ? (
        <div className="carregando">Carregando registros...</div>
      ) : registros.length > 0 ? (
        <>
          {/* VISUALIZAÇÃO CARDS */}
          {visualizacao === 'cards' && (
            <div className="cards-container">
              {registros.map((registro, idx) => (
                <div key={idx} className="card-r2d">
                  <div className="card-header">
                    <h3>{registro.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER || '#'}</h3>
                    <span className={`badge ${registro.STATUS_APROVACAO_PO?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {registro.STATUS_APROVACAO_PO}
                    </span>
                  </div>

                  <div className="card-prioridade">
                    <strong>PRIORIDADE DE COMPRA:</strong> {registro.PRIORIDADE_COMPRA || '-'}
                  </div>

                  <div className="card-section">
                    <h4>DADOS PR</h4>
                    <div className="dados-grid">
                      <div className="dado">
                        <label>UNIDADE OPERACIONAL</label>
                        <p>{registro.UNIDADE_OPERACIONAL_PR || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>PR ORACLE</label>
                        <p>{registro.PR_ORACLE_REQUISIÇÃO_DE_COMPRA_NO_ORACLE || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>NÚMERO LINHA PR</label>
                        <p>{registro.NUMERO_LINHA_PR || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>DEPARTAMENTO</label>
                        <p>{registro.DEPARTMENT || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>DATA NECESSÁRIA PR</label>
                        <p>{registro.DATA_NECESSARIA_PR ? new Date(registro.DATA_NECESSARIA_PR).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="dado">
                        <label>CÓDIGO ITEM</label>
                        <p>{registro.CODIGO_ITEM_PR || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>SPN</label>
                        <p>{registro.SPN || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>ID</label>
                        <p>{registro.ID || '-'}</p>
                      </div>
                    </div>

                    <div className="descricoes">
                      <div className="descricao">
                        <label>DESCRIÇÃO ITEM (PORTUGUÊS)</label>
                        <p>{registro.DESCRICAO_ITEM_PTB || '-'}</p>
                      </div>
                      <div className="descricao">
                        <label>DESCRIÇÃO ITEM (INGLÊS)</label>
                        <p>{registro.DESCRICAO_ITEM_US || '-'}</p>
                      </div>
                    </div>

                    <div className="quantidade-grid">
                      <div className="dado">
                        <label>UNIDADE MEDIDA</label>
                        <p>{registro.UNIDADE_DE_MEDIDA_PR || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>QUANTIDADE PR</label>
                        <p>{parseFloat(registro.QUANTIDADE_PR || 0).toFixed(4)}</p>
                      </div>
                      <div className="dado">
                        <label>QUANTIDADE ATENDIDA</label>
                        <p>{parseFloat(registro.QUANTIDADE_ATENDIDA_PR || 0).toFixed(4)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="card-section">
                    <h4>DADOS PO</h4>
                    <div className="dados-grid">
                      <div className="dado">
                        <label>NÚMERO PO</label>
                        <p>{registro.NUMERO_PO || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>COMPRADOR PO</label>
                        <p>{registro.COMPRADOR_PO || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>FORNECEDOR</label>
                        <p>{registro.NOME_FORNECEDOR_PO || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>STATUS APROVAÇÃO</label>
                        <p>{registro.STATUS_APROVACAO_PO || '-'}</p>
                      </div>
                      <div className="dado">
                        <label>QUANTIDADE PO</label>
                        <p>{parseFloat(registro.QUANTIDADE_PO || 0).toFixed(4)}</p>
                      </div>
                      <div className="dado">
                        <label>VALOR UNITÁRIO</label>
                        <p>R$ {parseFloat(registro.VALOR_UNITARIO_PO || 0).toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="dado">
                        <label>TOTAL LINHA</label>
                        <p>R$ {parseFloat(registro.TOTAL_LINHA_PO || 0).toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="dado">
                        <label>DATA CRIAÇÃO PO</label>
                        <p>{registro.DATA_CRIACAO_PO ? new Date(registro.DATA_CRIACAO_PO).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="dado">
                        <label>DATA PROMETIDA</label>
                        <p>{registro.DATA_PROMETIDA_ORIGINAL_PO_2 ? new Date(registro.DATA_PROMETIDA_ORIGINAL_PO_2).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="dado">
                        <label>QUANTIDADE RECEBIDA</label>
                        <p>{parseFloat(registro.QUANTIDADE_RECEBIDA_PO || 0).toFixed(4)}</p>
                      </div>
                      <div className="dado">
                        <label>QUANTIDADE EM ABERTO</label>
                        <p>{parseFloat(registro.QUANTIDADE_EM_ABERTO_PO || 0).toFixed(4)}</p>
                      </div>
                      <div className="dado">
                        <label>STATUS FECHAMENTO</label>
                        <p>{registro.STATUS_FECHAMENTO_LINHA_PO || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISUALIZAÇÃO TABELA */}
          {visualizacao === 'tabela' && (
            <div className="tabela-container">
              <table className="tabela-r2d">
                <thead>
                  <tr>
                    <th>PR TM MASTER</th>
                    <th>STATUS</th>
                    <th>PRIORIDADE</th>
                    <th>SPN</th>
                    <th>DESCRIÇÃO</th>
                    <th>QTD PR</th>
                    <th>NÚMERO PO</th>
                    <th>FORNECEDOR</th>
                    <th>DATA CRIAÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((registro, idx) => (
                    <tr key={idx}>
                      <td>{registro.PR_TM_MASTER_REQUISIÇÃO_DE_COMPRA_NO_TM_MASTER || '-'}</td>
                      <td><span className={`badge ${registro.STATUS_APROVACAO_PO?.toLowerCase().replace(/\s+/g, '-')}`}>{registro.STATUS_APROVACAO_PO}</span></td>
                      <td>{registro.PRIORIDADE_COMPRA || '-'}</td>
                      <td>{registro.SPN || '-'}</td>
                      <td>{registro.DESCRICAO_ITEM_US || '-'}</td>
                      <td>{parseFloat(registro.QUANTIDADE_PR || 0).toFixed(4)}</td>
                      <td>{registro.NUMERO_PO || '-'}</td>
                      <td>{registro.NOME_FORNECEDOR_PO || '-'}</td>
                      <td>{registro.DATA_CRIACAO_PO ? new Date(registro.DATA_CRIACAO_PO).toLocaleDateString('pt-BR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINAÇÃO */}
          <div className="paginacao-container">
            <div className="info-paginacao">
              Exibindo registros {paginacao.inicio_registro} de {paginacao.fim_registro} 
              (Total: {paginacao.total_registros})
            </div>

            <div className="controles-paginacao">
              <button 
                onClick={paginaAnterior}
                disabled={!paginacao.tem_anterior}
                className="btn-nav"
              >
                ← Anterior
              </button>

              <div className="numero-paginas">
                <label>Página:</label>
                <input
                  type="number"
                  min="1"
                  max={paginacao.total_paginas}
                  value={paginacao.pagina_atual}
                  onChange={(e) => irParaPagina(parseInt(e.target.value) || 1)}
                  className="input-pagina"
                />
                <span>de {paginacao.total_paginas}</span>
              </div>

              <button 
                onClick={proximaPagina}
                disabled={!paginacao.tem_proxima}
                className="btn-nav"
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="sem-registros">
          <p>Nenhum registro encontrado.</p>
          <p>Tente ajustar os filtros para encontrar registros.</p>
        </div>
      )}
    </div>
  );
}
