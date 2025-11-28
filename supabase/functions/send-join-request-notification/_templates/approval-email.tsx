import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "https://esm.sh/@react-email/components@0.0.22";
import * as React from "https://esm.sh/react@18.3.1";

interface ApprovalEmailProps {
  playerName: string;
  teamName: string;
  gameTitle?: string;
  dashboardUrl: string;
}

export function ApprovalEmail({
  playerName = "Jogador",
  teamName = "Seu Time",
  gameTitle,
  dashboardUrl = "https://app.soccersquad.com.br",
}: ApprovalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>✅ Você foi aprovado no {teamName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://fupqwyzwjvlnklbazqjm.supabase.co/storage/v1/object/public/assets/soccer-squad-logo.jpeg"
              width="80"
              height="80"
              alt="Soccer Squad Logo"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>🎉 Você foi aprovado!</Heading>
          
          <Text style={text}>
            Olá <strong>{playerName}</strong>,
          </Text>
          
          <Text style={text}>
            Ótimas notícias! Sua solicitação para entrar no time <strong>{teamName}</strong> foi <strong style={approvedText}>aprovada</strong>!
          </Text>
          
          {gameTitle && (
            <Section style={gameSection}>
              <Text style={gameText}>
                ⚽ Você já pode fazer check-in para o jogo: <strong>{gameTitle}</strong>
              </Text>
            </Section>
          )}
          
          <Text style={text}>
            Acesse o dashboard agora para:
          </Text>
          
          <ul style={list}>
            <li>✅ Fazer check-in para jogos</li>
            <li>👥 Ver todos os jogadores do time</li>
            <li>📊 Acompanhar estatísticas e rankings</li>
            <li>🏆 Participar de campeonatos</li>
          </ul>
          
          <Section style={buttonSection}>
            <Link href={dashboardUrl} style={button}>
              Acessar Dashboard
            </Link>
          </Section>
          
          <Text style={footer}>
            Bem-vindo ao time! ⚽🔥
          </Text>
          
          <Text style={footerSmall}>
            Soccer Squad - Gerenciamento de Times de Futebol
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0f1a",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#1a2332",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "600px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "30px",
};

const logo = {
  borderRadius: "50%",
  margin: "0 auto",
};

const h1 = {
  color: "#00ff87",
  fontSize: "32px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "16px",
};

const approvedText = {
  color: "#00ff87",
};

const gameSection = {
  backgroundColor: "#0ea5e9",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "2px solid #00ff87",
};

const gameText = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0",
  textAlign: "center" as const,
};

const list = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "24px",
  paddingLeft: "20px",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#00ff87",
  borderRadius: "6px",
  color: "#0a0f1a",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
};

const footer = {
  color: "#00ff87",
  fontSize: "18px",
  fontWeight: "bold",
  textAlign: "center" as const,
  marginTop: "32px",
};

const footerSmall = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "16px",
};
