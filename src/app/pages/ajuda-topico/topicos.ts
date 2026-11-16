export interface TopicoAjuda {
  titulo: string;
  subtitulo: string;
  bannerTitulo: string;
  bannerTexto: string;
  /** Cada passo aceita <strong> para destacar palavras. */
  passos: string[];
  dica?: string;
  /** Arquivo em public/img/ajuda/ (troque pelo print real da tela, se quiser). */
  imagem: string;
  legendaImagem: string;
}

export const TOPICOS_AJUDA: Record<string, TopicoAjuda> = {
  cadastro: {
    titulo: 'Cadastro e Perfis',
    subtitulo: 'Nesta página, você aprenderá como realizar o cadastro de usuários e entender os perfis disponíveis no sistema',
    bannerTitulo: 'Como funciona o cadastro?',
    bannerTexto: 'Consulte os passos para cadastrar pacientes e profissionais.',
    passos: [
      'Acesse o menu Pacientes e clique em <strong>Novo Paciente.</strong>',
      'Preencha os <strong>Dados Pessoais</strong> do paciente, com nome, data de nascimento, CPF, endereço e status.',
      'Informe os dados do <strong>Responsável</strong> como nome, CPF, telefone e grau de parentesco.',
      'Clique em <strong>Cadastrar</strong> para salvar as informações.',
    ],
    dica: 'Dica: O status pode ser Ativo ou Inativo, conforme a situação do paciente.',
    imagem: 'cadastro.png',
    legendaImagem: 'Tela de cadastro de novo paciente',
  },
  agenda: {
    titulo: 'Agenda principal',
    subtitulo: 'Aprenda a gerenciar a agenda de todas as consultas marcadas.',
    bannerTitulo: 'Como funciona a agenda principal?',
    bannerTexto: 'Consulte os passos para acompanhar todas as consultas da clínica.',
    passos: [
      'Na <strong>Agenda</strong>, use as setas ou o botão <strong>Hoje</strong> para navegar entre as semanas e encontrar o dia desejado.',
      'Cada consulta aparece no horário em que começa, com o nome do paciente, o <strong>tipo de atendimento</strong> (presencial ou online) e o profissional.',
      'As cores mostram a situação da consulta: <strong>confirmada</strong>, <strong>a confirmar</strong>, <strong>cancelada</strong> ou <strong>remarcada</strong>. O resumo ao lado conta cada uma e mostra o próximo atendimento.',
    ],
    imagem: 'agenda.png',
    legendaImagem: 'Tela da agenda principal',
  },
  prontuarios: {
    titulo: 'Pacientes',
    subtitulo: 'Aprenda a visualizar o prontuário de cada paciente',
    bannerTitulo: 'Como funciona o histórico?',
    bannerTexto: 'Consulte todas as funcionalidades na página de paciente.',
    passos: [
      'No menu lateral esquerdo, clique na opção "<strong>Pacientes</strong>" para visualizar os pacientes cadastrados no sistema.',
      'Pacientes cadastrados: na parte superior, o sistema apresenta a quantidade total de pacientes registrados, permitindo acompanhar o número de cadastros.',
      'No perfil de cada paciente estão o histórico dele, o status de ativo ou inativo, o <strong>prontuário</strong> e as ações de editar ou excluir.',
      'No botão "<strong>Ver prontuário</strong>" é possível abrir as informações pessoais, o responsável, as últimas informações e as seções de documentos do paciente.',
    ],
    imagem: 'prontuarios.png',
    legendaImagem: 'Lista de pacientes',
  },
  agendamentos: {
    titulo: 'Agendamentos',
    subtitulo: 'Aprenda a marcar e visualizar as consultas do paciente.',
    bannerTitulo: 'Como marcar uma consulta?',
    bannerTexto: 'Consulte os passos para marcar uma consulta.',
    passos: [
      'Nos campos <strong>Paciente</strong>, <strong>Responsável</strong> e <strong>Profissional</strong> é possível selecionar o paciente que receberá o atendimento; o responsável é preenchido automaticamente.',
      'O campo <strong>Tipo de atendimento</strong> serve para selecionar a modalidade (presencial ou online) do atendimento que será realizado.',
      'A <strong>Disponibilidade</strong> mostra os dias em que o profissional pode atender, enquanto os <strong>horários disponíveis</strong> permitem selecionar o melhor horário para a consulta.',
    ],
    imagem: 'agendamentos.png',
    legendaImagem: 'Tela de gerenciamento de consultas',
  },
};
