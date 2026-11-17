import { Injectable, inject, signal } from '@angular/core';

import { Perfil } from './perfil';
import { FormatoData, formatoDataAtual } from './util';
import { Auth } from './auth';
import { Aviso } from './aviso/aviso';
import { PreferenciasApiService, PreferenciasUsuarioApi } from './clinica/preferencias-api.service';

export type Tema = 'claro' | 'escuro';

export interface Preferencias {
  idioma: 'pt' | 'en';
  formatoData: FormatoData;
  /** Duração padrão da consulta, em minutos. */
  duracao: string;
  /** 0 = domingo ... 6 = sábado */
  inicioSemana: number;
  lembreteEmail: boolean;
  lembreteAlertas: boolean;
  avisoSistema: boolean;
  doisFatores: boolean;
  tema: Tema;
}

export interface DadosPerfil {
  nome: string;
  cargo: string;
  email: string;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  idioma: 'pt', formatoData: 'DD/MM/AAAA', duracao: '50', inicioSemana: 1,
  lembreteEmail: false, lembreteAlertas: false, avisoSistema: false, doisFatores: false, tema: 'claro',
};

const PERFIS_PADRAO: Record<Perfil, DadosPerfil> = {
  secretaria: { nome: 'Dra. Juliana da Costa', cargo: 'Secretária Responsável', email: 'juliana.costa@neurovita.com.br' },
  admin: { nome: 'Administrador do Sistema', cargo: 'Administrador', email: 'admin@neurovita.com' },
};

const CHAVE_PREFERENCIAS = 'neurovita.preferencias';
const CHAVE_PERFIS = 'neurovita.perfis';

function ler<T>(chave: string, padrao: T): T {
  try {
    const texto = localStorage.getItem(chave);
    return texto ? { ...padrao, ...JSON.parse(texto) } : { ...padrao };
  } catch {
    return { ...padrao };
  }
}

function guardar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: as preferências valem só até recarregar a página */
  }
}

/**
 * Preferências do sistema (tela Configurações). Ficam guardadas no navegador.
 * TODO (back-end): salvar por usuário na API.
 */
@Injectable({ providedIn: 'root' })
export class Configuracoes {
  private readonly auth = inject(Auth);
  private readonly api = inject(PreferenciasApiService);
  private readonly aviso = inject(Aviso);
  readonly salvas = signal<Preferencias>(ler(CHAVE_PREFERENCIAS, PREFERENCIAS_PADRAO));
  readonly perfis = signal<Record<Perfil, DadosPerfil>>({
    secretaria: ler(CHAVE_PERFIS + '.secretaria', PERFIS_PADRAO.secretaria),
    admin: ler(CHAVE_PERFIS + '.admin', PERFIS_PADRAO.admin),
  });

  constructor() {
    this.aplicar(this.salvas());
    this.auth.sessaoAlterada$.subscribe((autenticado) => {
      if (autenticado) this.carregarDaApi();
    });
    if (this.auth.obterToken()) this.carregarDaApi();
  }

  salvar(p: Preferencias): void {
    if (!this.auth.obterToken()) {
      this.aplicarPreferencias(p);
      return;
    }
    this.api.salvar({
      lembretesConsultaEmail: p.lembreteEmail,
      alertasConsultasPendentes: p.lembreteAlertas,
      notificacoesSistema: p.avisoSistema,
      tema: p.tema.toUpperCase() as 'CLARO' | 'ESCURO',
      idioma: (p.idioma === 'pt' ? 'PORTUGUES' : 'INGLES'),
      formatoData: p.formatoData,
      duracaoPadraoConsulta: Number(p.duracao),
      ...(p.inicioSemana === 0 || p.inicioSemana === 1
        ? { inicioSemana: p.inicioSemana === 0 ? 'DOMINGO' : 'SEGUNDA-FEIRA' }
        : {}),
    }).subscribe({
      next: (resposta) => this.aplicarPreferencias(this.daApi(resposta, p)),
      error: () => this.aviso.mostrar('Não foi possível salvar as preferências no servidor. Tente novamente.'),
    });
  }

  restaurarPadrao(): Preferencias {
    return { ...PREFERENCIAS_PADRAO };
  }

  salvarPerfil(perfil: Perfil, dados: DadosPerfil): void {
    this.perfis.update((atual) => ({ ...atual, [perfil]: dados }));
    guardar(CHAVE_PERFIS + '.' + perfil, dados);
  }

  private carregarDaApi(): void {
    this.api.buscar().subscribe({
      next: (resposta) => this.aplicarPreferencias(this.daApi(resposta, this.salvas())),
      error: () => this.aviso.mostrar('Não foi possível carregar as preferências da sua conta.'),
    });
  }

  private daApi(api: PreferenciasUsuarioApi, base: Preferencias): Preferencias {
    return {
      ...base,
      lembreteEmail: api.lembretesConsultaEmail ?? base.lembreteEmail,
      lembreteAlertas: api.alertasConsultasPendentes ?? base.lembreteAlertas,
      avisoSistema: api.notificacoesSistema ?? base.avisoSistema,
      tema: api.tema?.toLowerCase() as Tema ?? base.tema,
      idioma: api.idioma === 'PORTUGUES' ? 'pt' : api.idioma === 'INGLES' ? 'en' : base.idioma,
      formatoData: api.formatoData ?? base.formatoData,
      duracao: api.duracaoPadraoConsulta == null ? base.duracao : String(api.duracaoPadraoConsulta),
      inicioSemana: api.inicioSemana === 'DOMINGO' ? 0 : api.inicioSemana === 'SEGUNDA-FEIRA' ? 1 : base.inicioSemana,
    };
  }

  private aplicarPreferencias(p: Preferencias): void {
    this.salvas.set({ ...p });
    guardar(CHAVE_PREFERENCIAS, p);
    this.aplicar(p);
  }

  /** Coloca em prática o que dá para aplicar na hora: tema, idioma da página e formato das datas. */
  private aplicar(p: Preferencias): void {
    formatoDataAtual.set(p.formatoData);
    if (typeof document !== 'undefined') {
      document.documentElement.dataset['tema'] = p.tema;
      document.documentElement.lang = p.idioma === 'en' ? 'en' : 'pt-BR';
    }
  }
}
