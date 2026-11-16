import { Secao } from './modelos';

export interface ConfigSecao {
  id: Secao;
  /** "Laudos" */
  rotulo: string;
  /** "Laudo" */
  singular: string;
  botaoNovo: string;
  tituloCartao: string;
  botaoSalvar: string;
  dialogoTitulo: string;
  dialogoConfirmar: string;
  vazioEditor: string;
  vazioLista: string;
  informacao: string;
  /** 'leitura' = abre direto no texto (evoluções); 'lista' = tela com a lista de documentos. */
  modo: 'leitura' | 'lista' | 'galeria';
  /**
   * Só no modo 'galeria' (miniaturas dos documentos). Variante 'a': botão "Adicionar documentos" na faixa
   * do paciente. Variante 'b': seletor de seção na faixa e painel do paciente ao lado.
   */
  galeria?: { variante: 'a' | 'b'; titulo: string; subtitulo: string; tituloCartao: string };
  /** Texto de apoio mostrado abaixo do nome da seção no prontuário. */
  descricao?: string;
  /** Grupos em que a galeria é dividida (ex.: "Documentos pessoais" e "Exames"). */
  grupos?: string[];
  /** Legenda pequena mostrada embaixo do título de cada grupo (opcional). */
  subtituloGrupos?: string;
  /** Filtros da tela de lista. */
  filtros: 'data-busca' | 'data-tipo-anexo';
  /** O editor mostra data, tipo de atendimento e anexos? */
  camposNoEditor: boolean;
  /** O editor mostra a lista da lateral? */
  listaNoEditor: boolean;
}

export const SECOES: Record<Secao, ConfigSecao> = {
  evolucoes: {
    id: 'evolucoes',
    rotulo: 'Evoluções',
    singular: 'Evolução',
    botaoNovo: '+Nova Evolução',
    tituloCartao: 'Evolução do Paciente',
    botaoSalvar: 'Salvar Evolução',
    dialogoTitulo: 'Salvar Edição?',
    dialogoConfirmar: 'Salvar',
    vazioEditor: 'Comece a escrever uma nova evolução',
    vazioLista: 'Nenhuma evolução registrada ainda.',
    informacao: 'Aqui você encontra todas as evoluções registradas no acompanhamento do paciente.',
    modo: 'galeria',
    galeria: { variante: 'a', titulo: 'Evolução', subtitulo: 'Registre o atendimento e acompanhe o paciente', tituloCartao: 'Evolução do Paciente' },
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  laudos: {
    id: 'laudos',
    rotulo: 'Laudos',
    singular: 'Laudo',
    botaoNovo: '+ Novo Laudo',
    tituloCartao: 'Laudos do Paciente',
    botaoSalvar: 'Salvar Laudo',
    dialogoTitulo: 'Confirmar Laudo?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu laudo',
    vazioLista: 'Nenhum laudo cadastrado ainda.',
    informacao: 'Os laudos devem ser elaborados com base em dados clínicos, entrevistas, testes e observações do acompanhamento.',
    modo: 'galeria',
    galeria: { variante: 'a', titulo: 'Laudos', subtitulo: 'Registre o atendimento e acompanhe o paciente', tituloCartao: 'Laudos do Paciente' },
    filtros: 'data-busca',
    camposNoEditor: false,
    listaNoEditor: false,
  },
  encaminhamentos: {
    id: 'encaminhamentos',
    rotulo: 'Encaminhamentos',
    singular: 'Encaminhamento',
    botaoNovo: '+ Novo Encaminhamento',
    tituloCartao: 'Encaminhamentos do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu encaminhamento',
    vazioLista: 'Nenhum encaminhamento cadastrado ainda.',
    informacao: 'Os encaminhamentos devem informar o motivo, o objetivo e o serviço ou profissional de destino.',
    modo: 'galeria',
    galeria: { variante: 'b', titulo: 'Encaminhamentos', subtitulo: 'Histórico e informações do paciente', tituloCartao: 'Encaminhamentos do Paciente' },
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  avaliacoes: {
    id: 'avaliacoes',
    rotulo: 'Avaliações Psicológicas',
    singular: 'Avaliação Psicológica',
    botaoNovo: '+ Nova Avaliação',
    tituloCartao: 'Avaliações Psicológicas do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever sua avaliação',
    vazioLista: 'Nenhuma avaliação cadastrada ainda.',
    informacao: 'As avaliações devem registrar os procedimentos, instrumentos utilizados e os resultados obtidos.',
    modo: 'lista',
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  atestados: {
    id: 'atestados',
    rotulo: 'Atestados',
    singular: 'Atestado',
    botaoNovo: '+ Novo Atestado',
    tituloCartao: 'Atestados do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu atestado',
    vazioLista: 'Nenhum atestado cadastrado ainda.',
    informacao: 'Os atestados devem conter data, finalidade e identificação do profissional responsável.',
    modo: 'galeria',
    galeria: { variante: 'a', titulo: 'Atestados', subtitulo: 'Registre o atendimento e acompanhe o paciente', tituloCartao: 'Atestados do Paciente' },
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  medicamentos: {
    id: 'medicamentos',
    rotulo: 'Medicamentos e prescrições',
    singular: 'Prescrição',
    botaoNovo: '+ Nova Prescrição',
    tituloCartao: 'Medicamentos e prescrições do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever sua prescrição',
    vazioLista: 'Nenhuma prescrição cadastrada ainda.',
    informacao: 'As prescrições devem informar o medicamento, a dose, a frequência e a duração do tratamento.',
    modo: 'lista',
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  atestadosMedicos: {
    id: 'atestadosMedicos',
    rotulo: 'Atestados Médicos',
    singular: 'Atestado Médico',
    botaoNovo: '+ Novo Atestado',
    tituloCartao: 'Atestados Médicos do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu atestado',
    vazioLista: 'Nenhum atestado cadastrado ainda.',
    informacao: 'Os atestados devem conter data, finalidade, período de afastamento (quando houver) e a identificação do médico responsável.',
    modo: 'lista',
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  exames: {
    id: 'exames',
    rotulo: 'Solicitar Exames',
    singular: 'Solicitação de Exames',
    botaoNovo: '+ Nova Solicitação',
    tituloCartao: 'Solicitações de Exames do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever sua solicitação',
    vazioLista: 'Nenhuma solicitação cadastrada ainda.',
    informacao: 'Informe os exames solicitados, a justificativa clínica e o diagnóstico (CID) relacionado.',
    modo: 'lista',
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  acolhimento: {
    id: 'acolhimento',
    rotulo: 'Acolhimento',
    singular: 'Acolhimento',
    botaoNovo: '+ Novo Documento',
    tituloCartao: 'Acolhimento do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu documento',
    vazioLista: 'Nenhum documento adicionado ainda.',
    informacao: 'Evolução da assistência social, relatório escolar, evoluções e declarações escolares.',
    descricao: 'Evolução da assistência social, relatório escolar, evoluções e declarações escolares.',
    grupos: ['Evolução da Assistência Social', 'Relatório escolar'],
    subtituloGrupos: 'Fotos de documentos de identificação do paciente',
    modo: 'galeria',
    galeria: { variante: 'a', titulo: 'Acolhimento', subtitulo: 'Registre o atendimento e acompanhe o paciente', tituloCartao: 'Acolhimento do Paciente' },
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  documentacoes: {
    id: 'documentacoes',
    rotulo: 'Documentações',
    singular: 'Documentação',
    botaoNovo: '+ Novo Documento',
    tituloCartao: 'Documentações do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu documento',
    vazioLista: 'Nenhum documento adicionado ainda.',
    informacao: 'Fotos de documentos pessoais, exames de imagem, cartões de vacina e outros...',
    descricao: 'Fotos de documentos pessoais, exames de imagem, cartões de vacina e outros...',
    grupos: ['Documentos pessoais', 'Exames'],
    modo: 'galeria',
    galeria: { variante: 'a', titulo: 'Documentações', subtitulo: 'Registre o atendimento e acompanhe o paciente', tituloCartao: 'Documentações do Paciente' },
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  rastreio: {
    id: 'rastreio',
    rotulo: 'Rastreio',
    singular: 'Rastreio',
    botaoNovo: '+ Novo Documento',
    tituloCartao: 'Rastreio do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu documento',
    vazioLista: 'Nenhum documento adicionado ainda.',
    informacao: 'Evoluções e relatório escolar do paciente.',
    descricao: 'Evoluções e relatório escolar do paciente.',
    grupos: ['Evoluções', 'Relatório Escolar'],
    modo: 'galeria',
    galeria: { variante: 'a', titulo: 'Rastreio', subtitulo: 'Registre o atendimento e acompanhe o paciente', tituloCartao: 'Rastreio do Paciente' },
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
  devolutiva: {
    id: 'devolutiva',
    rotulo: 'Devolutiva',
    singular: 'Devolutiva',
    botaoNovo: '+ Novo Documento',
    tituloCartao: 'Devolutiva do Paciente',
    botaoSalvar: 'Salvar',
    dialogoTitulo: 'Confirmar Edição?',
    dialogoConfirmar: 'Confirmar',
    vazioEditor: 'Comece a escrever seu documento',
    vazioLista: 'Nenhum documento adicionado ainda.',
    informacao: 'Laudos e atestados psicológicos do paciente.',
    descricao: 'Laudos e atestados psicológicos do paciente.',
    grupos: ['Laudos', 'Atestados Psicológicos'],
    modo: 'galeria',
    galeria: { variante: 'a', titulo: 'Devolutiva', subtitulo: 'Registre o atendimento e acompanhe o paciente', tituloCartao: 'Devolutiva do Paciente' },
    filtros: 'data-tipo-anexo',
    camposNoEditor: true,
    listaNoEditor: true,
  },
};

/** Seções do prontuário, na ordem em que aparecem (só as 4 do prontuário, iguais para secretária e administrador). */
export const ORDEM_SECOES: Secao[] = ['acolhimento', 'documentacoes', 'rastreio', 'devolutiva'];

export function secoesDoPerfil(_perfil: string): Secao[] {
  return ORDEM_SECOES;
}

/** A seção da URL, se ela existir no prontuário desse perfil (senão, null). */
export function secaoDoPerfil(valor: string | undefined, perfil: string): Secao | null {
  return ehSecao(valor) && secoesDoPerfil(perfil).includes(valor) ? valor : null;
}

export function ehSecao(valor: string | undefined): valor is Secao {
  return !!valor && valor in SECOES;
}
