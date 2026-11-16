/** Os 2 tipos de usuário do NeuroVita. */
export type Perfil = 'secretaria' | 'admin';

/** Itens possíveis do menu lateral. */
export type ItemMenu = 'inicio' | 'pacientes' | 'profissionais' | 'secretaria' | 'agenda';

export type IconeAcao = 'mais' | 'usuario-mais';

export interface ConfigPerfil {
  layout: 'gestao' | 'profissional';
  /** Endereço da tela inicial do perfil. */
  rota: string;
  /** Título da aba do navegador. */
  titulo: string;
  saudacao: string;
  usuario: {
    nome: string;
    cargo: string;
    /** Caminho da foto (ex.: 'img/maria.jpg'). Sem foto, aparece um círculo com a inicial. */
    foto?: string;
    /** Círculo cinza liso, sem inicial (como no protótipo do Figma). */
    neutro?: boolean;
  };
  menu: ItemMenu[];
  /** Mostra a setinha ao lado do usuário (abre o menu "Sair"). */
  setaUsuario: boolean;
  /** Mostra os 3 pontinhos nas linhas da agenda e das próximas consultas. */
  menuAcoes: boolean;
  /** Os dois botões grandes (`rota` = para onde levam, quando a tela já existe). */
  acoes: { texto: string; icone: IconeAcao; rota?: string }[];
  /** Mostra o sino de notificações no topo. */
  sino: boolean;
  /** 'demo' = números fixos do protótipo; 'agenda' = calculados a partir das consultas marcadas. */
  fonte: 'demo' | 'agenda';
  banner: { variante: 'azul' | 'roxo'; titulo: string; texto?: string };
}

const BANNER_GESTAO = {
  variante: 'roxo',
  titulo: 'Seu trabalho organiza caminhos e torna cada atendimento possível todos os dias !',
} as const;

export const CONFIG_PERFIS: Record<Perfil, ConfigPerfil> = {
  secretaria: {
    layout: 'gestao',
    rota: '/secretaria',
    titulo: 'Início da secretária | NeuroVita',
    saudacao: 'Olá, Secretária',
    usuario: { nome: 'Juliana', cargo: 'Secretária' },
    menu: ['inicio', 'pacientes', 'agenda'],
    setaUsuario: true,
    menuAcoes: false,
    acoes: [
      { texto: 'Gerenciar Consultas', icone: 'mais', rota: '/secretaria/consultas' },
      { texto: 'Gerenciar paciente', icone: 'usuario-mais', rota: '/secretaria/pacientes' },
    ],
    sino: false,
    fonte: 'agenda',
    banner: BANNER_GESTAO,
  },
  admin: {
    layout: 'gestao',
    rota: '/admin',
    titulo: 'Início do administrador | NeuroVita',
    saudacao: 'Olá, Administrador',
    usuario: { nome: 'usuário', cargo: 'Administrador' },
    menu: ['inicio', 'pacientes', 'profissionais', 'secretaria', 'agenda'],
    setaUsuario: true,
    menuAcoes: false,
    acoes: [
      { texto: 'Gerenciar Profissional', icone: 'mais', rota: '/admin/profissionais' },
      { texto: 'Gerenciar secretária', icone: 'usuario-mais', rota: '/admin/secretarias' },
    ],
    sino: false,
    fonte: 'agenda',
    banner: BANNER_GESTAO,
  },
};

/** Telas que já existem para cada perfil (os outros itens do menu ainda não têm tela). */
const ROTAS_DO_MENU: Partial<Record<Perfil, Partial<Record<ItemMenu, string>>>> = {
  secretaria: { pacientes: '/secretaria/pacientes', agenda: '/secretaria/agenda' },
  admin: { pacientes: '/admin/pacientes', profissionais: '/admin/profissionais', secretaria: '/admin/secretarias', agenda: '/admin/agenda' },
};

/** Endereço de um item do menu, ou null se a tela ainda não existe. */
export function rotaDoMenu(perfil: Perfil, item: ItemMenu): string | null {
  if (item === 'inicio') return CONFIG_PERFIS[perfil].rota;
  return ROTAS_DO_MENU[perfil]?.[item] ?? null;
}
