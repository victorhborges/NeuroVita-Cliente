import { Component, computed, inject, input, signal } from '@angular/core';

import { AgendaDoDia } from '../../shared/agenda-do-dia/agenda-do-dia';
import { Cabecalho } from '../../shared/cabecalho/cabecalho';
import { CardsResumo } from '../../shared/cards-resumo/cards-resumo';
import {
  ConsultasApiService,
  ConsultaApi,
  StatusConsultaApi,
} from '../../shared/clinica/consultas-api.service';
import {
  PacientesApiService,
  PacienteApi,
} from '../../shared/clinica/pacientes-api.service';
import { ProfissionaisApiService, ProfissionalApi } from '../../shared/clinica/profissionais-api.service';
import { StatusConsulta } from '../../shared/clinica/modelos';
import { Icone } from '../../shared/icone/icone';
import { RouterLink } from '@angular/router';
import { CardResumo, ItemAgenda } from '../../shared/dados-demo';
import { CONFIG_PERFIS, Perfil } from '../../shared/perfil';
import { Auth } from '../../shared/auth';
import { Aviso } from '../../shared/aviso/aviso';

@Component({
  selector: 'app-painel-inicio',
  imports: [
    AgendaDoDia,
    Cabecalho,
    CardsResumo,
    Icone,
    RouterLink,
  ],
  templateUrl: './painel-inicio.html',
})
export class PainelInicio {
  readonly perfil = input.required<Perfil>();

  private readonly auth = inject(Auth);
  private readonly aviso = inject(Aviso);
  protected readonly config = computed(() => {
    const perfil = CONFIG_PERFIS[this.perfil()];
    const nome = this.auth.obterNome()?.trim() || 'Usuário';
    return { ...perfil, saudacao: `Olá, ${nome}`, usuario: { ...perfil.usuario, nome } };
  });
  private readonly consultasApi = inject(ConsultasApiService);
  private readonly pacientesApi = inject(PacientesApiService);
  private readonly profissionaisApi = inject(ProfissionaisApiService);

  private readonly consultas = signal<ConsultaApi[]>([]);
  private readonly pacientes = signal<PacienteApi[]>([]);
  private readonly profissionais = signal<ProfissionalApi[]>([]);
  private readonly hojeISO = this.dataAtualISO();

  private dataAtualISO(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  constructor() {
    this.carregarDados();
  }

  private carregarDados(): void {
    this.consultasApi.listarTodas().subscribe({
      next: (lista) => this.consultas.set(lista ?? []),
      error: (erro) => {
        console.error('Erro ao carregar consultas do painel:', erro);
        this.aviso.mostrar('Não foi possível carregar as consultas do painel.');
      },
    });

    this.pacientesApi.listarTodos().subscribe({
      next: (lista) => this.pacientes.set(lista ?? []),
      error: (erro) => {
        console.error('Erro ao carregar pacientes do painel:', erro);
        this.aviso.mostrar('Não foi possível carregar os pacientes do painel.');
      },
    });

    this.profissionaisApi.listarTodos().subscribe({
      next: (lista) => this.profissionais.set(lista ?? []),
      error: (erro) => {
        console.error('Erro ao carregar profissionais do painel:', erro);
        this.aviso.mostrar('Não foi possível carregar os profissionais da agenda.');
      },
    });
  }

  private nomePaciente(pacienteId: string): string {
    return this.pacientes().find((p) => p.id === pacienteId)?.nome ?? '—';
  }

  private converterStatus(status: StatusConsultaApi): StatusConsulta {
    const conversao: Record<StatusConsultaApi, StatusConsulta> = {
      PENDENTE: 'pendente',
      CONFIRMADA: 'confirmado',
      REMARCADA: 'remarcado',
      CANCELADA: 'cancelado',
    };

    return conversao[status] ?? 'pendente';
  }

  private consultasDeHoje(): ConsultaApi[] {
    return this.consultas()
      .filter((consulta) => consulta.dataHora.slice(0, 10) === this.hojeISO)
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  }

  protected readonly cards = computed<CardResumo[]>(() => {
    const lista = this.consultasDeHoje();

    const conta = (status: StatusConsultaApi) =>
      String(lista.filter((consulta) => consulta.status === status).length).padStart(2, '0');

    return [
      {
        valor: String(lista.length).padStart(2, '0'),
        rotulo: 'Consultas\nDo dia',
        icone: 'calendario',
      },
      {
        valor: conta('CONFIRMADA'),
        rotulo: 'Consultas\nConfirmadas',
        icone: 'usuario',
      },
      {
        valor: conta('PENDENTE'),
        rotulo: 'Consultas\nPendentes',
        icone: 'info',
      },
      {
        valor: conta('CANCELADA'),
        rotulo: 'Consultas\nCanceladas',
        icone: 'usuario-x',
      },
    ];
  });

  protected readonly agenda = computed<ItemAgenda[]>(() =>
    this.consultasDeHoje().map((consulta) => ({
      hora: consulta.dataHora.slice(11, 16),
      paciente: this.nomePaciente(consulta.pacienteId),
      telefone: this.pacientes().find((p) => p.id === consulta.pacienteId)?.telefone || '—',
      profissional: this.profissionais().find((p) => p.id === consulta.profissionalId)?.nome ?? '—',
      tipo: consulta.tipoAtendimento,
      status: this.converterStatus(consulta.status),
    })),
  );

}
