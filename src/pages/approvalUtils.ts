// Constantes para os status de aprovação (fluxo atualizado)
export const APPROVAL_STATUS = {
  PENDING: 0,                 // Pendente
  COORDINATOR_VERIFIED: 3,    // Verificado por Coordenador
  MANAGER_APPROVED: 1,        // Aprovado pela Gerência
  BACK_TO_COORDINATOR: 4,     // Retornado para Coordenador finalizar
  COMPLETED: 5,               // Concluído
  REJECTED: 2                 // Reprovado
};

// Função para mapear status numérico para texto
export const getStatusLabel = (status: number): string => {
  switch (status) {
    case APPROVAL_STATUS.PENDING: return 'Pendente';
    case APPROVAL_STATUS.COORDINATOR_VERIFIED: return 'Verificado por Coordenador';
    case APPROVAL_STATUS.MANAGER_APPROVED: return 'Aguardando Cadastro';
    case APPROVAL_STATUS.BACK_TO_COORDINATOR: return 'Retornado para Coordenador';
    case APPROVAL_STATUS.COMPLETED: return 'Concluído';
    case APPROVAL_STATUS.REJECTED: return 'Reprovado';
    default: return 'Desconhecido';
  }
};

// Função para obter classe CSS de acordo com o status
export const getStatusClass = (status: number): string => {
  switch (status) {
    case APPROVAL_STATUS.PENDING: return 'status-pending';
    case APPROVAL_STATUS.COORDINATOR_VERIFIED: return 'status-review';
    case APPROVAL_STATUS.MANAGER_APPROVED: return 'status-approved';
    case APPROVAL_STATUS.BACK_TO_COORDINATOR: return 'status-back-to-review';
    case APPROVAL_STATUS.COMPLETED: return 'status-completed';
    case APPROVAL_STATUS.REJECTED: return 'status-rejected';
    default: return '';
  }
};

// Função para mapear solicitacao status para texto
export const mapStatusToSolicitacaoStatus = (status: number): 'pendente' | 'em_revisao' | 'aprovado' | 'concluido' | 'reprovado' => {
  switch (status) {
    case APPROVAL_STATUS.PENDING: return 'pendente';
    case APPROVAL_STATUS.COORDINATOR_VERIFIED: return 'em_revisao';
    case APPROVAL_STATUS.MANAGER_APPROVED: return 'aprovado';
    case APPROVAL_STATUS.BACK_TO_COORDINATOR: return 'em_revisao';
    case APPROVAL_STATUS.COMPLETED: return 'concluido'; 
    case APPROVAL_STATUS.REJECTED: return 'reprovado';
    default: return 'pendente';
  }
};

// Função para mapear texto de status para número
export const mapSolicitacaoStatusToStatus = (status: string): number => {
  switch (status) {
    case 'pendente': return APPROVAL_STATUS.PENDING;
    case 'em_revisao': return APPROVAL_STATUS.COORDINATOR_VERIFIED;
    case 'aprovado': return APPROVAL_STATUS.MANAGER_APPROVED;
    case 'concluido': return APPROVAL_STATUS.COMPLETED;
    case 'reprovado': return APPROVAL_STATUS.REJECTED;
    default: return APPROVAL_STATUS.PENDING;
  }
};

// Função auxiliar para verificar se um usuário é do grupo VDF_MANAGER
export const isManager = (userGroups: string[]): boolean => {
  return userGroups.includes('VDF_MANAGER');
};

// Função auxiliar para verificar se um usuário é do grupo VDF_COORDINATOR
export const isCoordinator = (userGroups: string[]): boolean => {
  return userGroups.includes('VDF_COORDINATOR');
};

// Função para verificar se um usuário pode aprovar uma solicitação baseado em seu grupo e no status atual
export const canApprove = (
  userGroups: string[], 
  currentStatus: number
): boolean => {
  // Coordinator pode aprovar pendentes, retornados, ou finalizar após aprovação do gerente
  if (isCoordinator(userGroups)) {
    return currentStatus === APPROVAL_STATUS.PENDING || 
           currentStatus === APPROVAL_STATUS.BACK_TO_COORDINATOR ||
           currentStatus === APPROVAL_STATUS.MANAGER_APPROVED;
  }
  
  // Manager pode aprovar após verificação do Coordinator
  if (isManager(userGroups)) {
    return currentStatus === APPROVAL_STATUS.COORDINATOR_VERIFIED;
  }
  
  return false;
};

// Função para obter o próximo status baseado no status atual e no grupo do usuário
export const getNextStatus = (
  userGroups: string[], 
  currentStatus: number
): number => {
  if (isCoordinator(userGroups)) {
    switch (currentStatus) {
      case APPROVAL_STATUS.PENDING:
        return APPROVAL_STATUS.COORDINATOR_VERIFIED;
      case APPROVAL_STATUS.BACK_TO_COORDINATOR:
        return APPROVAL_STATUS.COMPLETED;
      case APPROVAL_STATUS.MANAGER_APPROVED:
        return APPROVAL_STATUS.COMPLETED; // Permitir que o coordenador confirme o cadastro
    }
  } else if (isManager(userGroups)) {
    if (currentStatus === APPROVAL_STATUS.COORDINATOR_VERIFIED) {
      return APPROVAL_STATUS.MANAGER_APPROVED;
    }
  }
  
  return currentStatus; // Sem mudança se não atender às condições
};

// Função para verificar se um usuário pode reprovar uma solicitação
export const canReject = (
  userGroups: string[], 
  currentStatus: number
): boolean => {
  // Solicitações já concluídas ou reprovadas não podem ser reprovadas
  if (currentStatus === APPROVAL_STATUS.COMPLETED || 
      currentStatus === APPROVAL_STATUS.REJECTED) {
    return false;
  }
  
  // Coordinator pode reprovar pendentes, verificados ou retornados
  if (isCoordinator(userGroups)) {
    return currentStatus === APPROVAL_STATUS.PENDING || 
           currentStatus === APPROVAL_STATUS.COORDINATOR_VERIFIED ||
           currentStatus === APPROVAL_STATUS.BACK_TO_COORDINATOR;
  }
  
  // Manager pode reprovar após verificação do Coordinator
  if (isManager(userGroups)) {
    return currentStatus === APPROVAL_STATUS.COORDINATOR_VERIFIED ||
           currentStatus === APPROVAL_STATUS.MANAGER_APPROVED;
  }
  
  return false;
};

// Função para determinar texto do botão de aprovação
export const getApprovalButtonText = (
  userGroups: string[], 
  currentStatus: number
): string => {
  if (isCoordinator(userGroups)) {
    switch (currentStatus) {
      case APPROVAL_STATUS.PENDING:
        return 'Verificar';
      case APPROVAL_STATUS.BACK_TO_COORDINATOR:
        return 'Concluir';
      case APPROVAL_STATUS.MANAGER_APPROVED:
        return 'Confirmar Cadastro';
      case APPROVAL_STATUS.COORDINATOR_VERIFIED:
        return 'Aguardar Aprovação da Gerência';
    }
  } else if (isManager(userGroups)) {
    if (currentStatus === APPROVAL_STATUS.COORDINATOR_VERIFIED) {
      return 'Aprovar';
    }
  }
  
  return 'Aprovar'; // Texto padrão
};