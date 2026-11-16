package com.neurovita.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.neurovita.dto.ProfissionalRequest;
import com.neurovita.model.Profissional;
import com.neurovita.model.Usuario;
import com.neurovita.repository.DisponibilidadeRepository;
import com.neurovita.repository.ProfissionalRepository;
import com.neurovita.repository.UsuarioRepository;

@ExtendWith(MockitoExtension.class)
class ProfissionalServiceTest {

    @Mock private ProfissionalRepository profissionalRepository;
    @Mock private DisponibilidadeRepository disponibilidadeRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailBoasVindasService emailBoasVindasService;
    @InjectMocks private ProfissionalService profissionalService;

    @BeforeEach
    void autenticarAdministrador() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin@neurovita.com",
                        "token",
                        List.of(new SimpleGrantedAuthority("ROLE_ADMINISTRADOR"))));
    }

    @AfterEach
    void limparAutenticacao() {
        SecurityContextHolder.clearContext();
    }

    private ProfissionalRequest request(Boolean online, Boolean presencial) {
        ProfissionalRequest request = new ProfissionalRequest();
        request.setNome("Ana Lima");
        request.setEmail("ana@neurovita.com");
        request.setCategoria("PSICOLOGO");
        request.setAtivo(true);
        request.setAtendeOnline(online);
        request.setAtendePresencial(presencial);
        return request;
    }

    @Test
    void cadastraProfissionalComoRegistroSemCriarContaDeAcesso() {
        when(profissionalRepository.findByEmailIgnoreCase("ana@neurovita.com"))
                .thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase("ana@neurovita.com"))
                .thenReturn(Optional.empty());
        when(profissionalRepository.save(any(Profissional.class)))
                .thenAnswer(invocation -> {
                    Profissional profissional = invocation.getArgument(0);
                    profissional.setId("prof-1");
                    return profissional;
                });
        ProfissionalRequest request = request(false, null);
        request.setEnviarEmailBoasVindas(true);

        var response = profissionalService.salvar(request);

        assertTrue(response.getProfissional().getAtendePresencial());
        assertFalse(response.isEmailBoasVindasEnviado());
        assertEquals(null, response.getSenhaProvisoria());
        verify(profissionalRepository).save(any(Profissional.class));
        verify(usuarioRepository, never()).save(any(Usuario.class));
        verify(emailBoasVindasService, never()).enviar(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void rejeitaCadastroSemModalidadeDeAtendimento() {
        when(profissionalRepository.findByEmailIgnoreCase("ana@neurovita.com"))
                .thenReturn(Optional.empty());
        when(usuarioRepository.findByEmailIgnoreCase("ana@neurovita.com"))
                .thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> profissionalService.salvar(request(false, false)));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(profissionalRepository, never()).save(any(Profissional.class));
    }

    @Test
    void atualizacaoParcialPreservaCamposOpcionaisEModalidadesOmitidas() {
        Profissional atual = new Profissional();
        atual.setId("prof-1");
        atual.setNome("Ana Lima");
        atual.setEmail("ana@neurovita.com");
        atual.setCategoria("PSICOLOGO");
        atual.setAtendeOnline(true);
        atual.setAtendePresencial(false);
        atual.setAtivo(true);
        atual.setEmailContato("contato@neurovita.com");
        atual.setNumeroRegistro("CRP-123");
        Usuario usuario = new Usuario();
        usuario.setAtivo(false);
        ProfissionalRequest request = new ProfissionalRequest();
        request.setNome("Ana Lima Atualizada");
        request.setCategoria("PSICOLOGO");

        when(profissionalRepository.findById("prof-1")).thenReturn(Optional.of(atual));
        when(profissionalRepository.save(any(Profissional.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = profissionalService.atualizar("prof-1", request);

        assertEquals("Ana Lima Atualizada", response.getNome());
        assertEquals("ana@neurovita.com", response.getEmail());
        assertEquals("contato@neurovita.com", response.getEmailContato());
        assertEquals("CRP-123", response.getNumeroRegistro());
        assertTrue(response.getAtendeOnline());
        assertFalse(response.getAtendePresencial());
        assertTrue(response.getAtivo());
        assertFalse(usuario.isAtivo());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void inativaProfissionalSemAtualizarContaLegada() {
        Profissional profissional = new Profissional();
        profissional.setId("prof-1");
        profissional.setAtivo(true);
        Usuario usuario = new Usuario();
        usuario.setPerfil("PROFISSIONAL");
        usuario.setAtivo(true);
        usuario.setEntidadeId("prof-1");
        when(profissionalRepository.findById("prof-1"))
                .thenReturn(Optional.of(profissional));
        when(profissionalRepository.save(profissional))
                .thenAnswer(invocation -> invocation.getArgument(0));

        profissionalService.deletar("prof-1");

        assertFalse(profissional.getAtivo());
        assertTrue(usuario.isAtivo());
        verify(profissionalRepository).save(profissional);
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void secretariaPodeConsultarDisponibilidadeDoProfissionalNaAgenda() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "secretaria@neurovita.test", "token", List.of(new SimpleGrantedAuthority("ROLE_SECRETARIA"))));
        Profissional profissional = new Profissional();
        profissional.setId("prof-1");
        profissional.setDisponibilidadeIds(List.of("disp-1"));
        when(profissionalRepository.findById("prof-1")).thenReturn(Optional.of(profissional));
        var disponibilidade = new com.neurovita.model.Disponibilidade();
        disponibilidade.setId("disp-1");
        when(disponibilidadeRepository.findById("disp-1")).thenReturn(Optional.of(disponibilidade));

        assertEquals(1, profissionalService.listarDisponibilidades("prof-1").size());
    }

    @Test
    void secretariaNaoPodeAlterarDisponibilidadeDoProfissional() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                "secretaria@neurovita.test", "token", List.of(new SimpleGrantedAuthority("ROLE_SECRETARIA"))));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> profissionalService.adicionarDisponibilidade("prof-1", "disp-1"));
        verify(profissionalRepository, never()).findById(anyString());
        verify(disponibilidadeRepository, never()).findById(anyString());
    }
}
