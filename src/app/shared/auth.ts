import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, map, tap } from 'rxjs';

import { Perfil, CONFIG_PERFIS } from './perfil';

interface LoginResponse { token: string; nome: string; email: string; perfil: string; }
interface UsuarioSessao { nome: string; email: string; perfil: Perfil; }
export type ResultadoLogin =
  | { ok: true; rota: string; primeiroAcesso: boolean }
  | { ok: false; motivo: 'perfil' };

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly eventoSessao = new Subject<boolean>();
  readonly sessaoAlterada$ = this.eventoSessao.asObservable();
  private readonly chaveToken = 'neurovita_token';
  private readonly chaveUsuario = 'neurovita_usuario';

  entrar(email: string, senha: string): Observable<ResultadoLogin> {
    return this.http.post<LoginResponse>('/api/auth/login', { email: email.trim(), senha }).pipe(
      map((resposta) => {
        const perfil = resposta.perfil.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        if (perfil !== 'ADMINISTRADOR' && perfil !== 'ADMIN' && perfil !== 'SECRETARIA') {
          return { ok: false, motivo: 'perfil' } as const;
        }
        const frontend: Perfil = perfil === 'SECRETARIA' ? 'secretaria' : 'admin';
        sessionStorage.setItem(this.chaveToken, resposta.token);
        sessionStorage.setItem(this.chaveUsuario, JSON.stringify({ nome: resposta.nome, email: resposta.email, perfil: frontend } satisfies UsuarioSessao));
        this.eventoSessao.next(true);
        return { ok: true, rota: CONFIG_PERFIS[frontend].rota, primeiroAcesso: this.ehPrimeiroAcesso() } as const;
      }),
    );
  }

  alterarSenhaPrimeiroAcesso(novaSenha: string, confirmarSenha: string): Observable<void> {
    return this.http.post<void>('/api/auth/primeiro-acesso/alterar-senha', { novaSenha, confirmarSenha });
  }

  alterarSenhaAutenticada(senhaAtual: string, novaSenha: string, confirmarSenha: string): Observable<void> {
    return this.http.post<void>('/api/auth/alterar-senha', { senhaAtual, novaSenha, confirmarSenha }).pipe(tap(() => this.sair()));
  }

  obterToken(): string | null { return sessionStorage.getItem(this.chaveToken); }
  obterPerfil(): Perfil | null {
    try {
      const usuario = JSON.parse(sessionStorage.getItem(this.chaveUsuario) ?? 'null') as UsuarioSessao | null;
      return usuario?.perfil === 'admin' || usuario?.perfil === 'secretaria' ? usuario.perfil : null;
    } catch { return null; }
  }
  obterNome(): string | null {
    try { return (JSON.parse(sessionStorage.getItem(this.chaveUsuario) ?? 'null') as UsuarioSessao | null)?.nome ?? null; }
    catch { return null; }
  }
  obterEmail(): string | null {
    try { return (JSON.parse(sessionStorage.getItem(this.chaveUsuario) ?? 'null') as UsuarioSessao | null)?.email ?? null; }
    catch { return null; }
  }
  ehPrimeiroAcesso(): boolean {
    const token = this.obterToken();
    if (!token) return false;
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))).primeiroAcesso === true;
    } catch { return false; }
  }
  sair(): void {
    sessionStorage.removeItem(this.chaveToken);
    sessionStorage.removeItem(this.chaveUsuario);
    this.eventoSessao.next(false);
  }
}
