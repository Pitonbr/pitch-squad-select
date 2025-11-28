import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "https://esm.sh/@react-email/components@0.0.22";
import * as React from "https://esm.sh/react@18.3.1";

interface RejectionEmailProps {
  playerName: string;
  teamName: string;
  gameTitle?: string;
}

export function RejectionEmail({
  playerName = "Jogador",
  teamName = "Time",
  gameTitle,
}: RejectionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sobre sua solicitação de entrada no {teamName}</Preview>
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
          
          <Heading style={h1}>Sobre sua solicitação</Heading>
          
          <Text style={text}>
            Olá <strong>{playerName}</strong>,
          </Text>
          
          <Text style={text}>
            Agradecemos seu interesse em participar do time <strong>{teamName}</strong>.
          </Text>
          
          {gameTitle && (
            <Section style={gameSection}>
              <Text style={gameText}>
                Jogo: {gameTitle}
              </Text>
            </Section>
          )}
          
          <Text style={text}>
            Infelizmente, sua solicitação de entrada não foi aprovada no momento. O administrador do time pode ter diversos motivos para esta decisão.
          </Text>
          
          <Text style={text}>
            <strong>O que você pode fazer:</strong>
          </Text>
          
          <ul style={list}>
            <li>Entre em contato diretamente com o administrador do time</li>
            <li>Busque outros times disponíveis na plataforma</li>
            <li>Crie seu próprio time e convide seus amigos</li>
          </ul>
          
          <Text style={footer}>
            Obrigado por usar o Soccer Squad! ⚽
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
  color: "#e0e0e0",
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

const gameSection = {
  backgroundColor: "#1e3a4f",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const gameText = {
  color: "#0ea5e9",
  fontSize: "14px",
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

const footer = {
  color: "#9ca3af",
  fontSize: "16px",
  textAlign: "center" as const,
  marginTop: "32px",
};

const footerSmall = {
  color: "#6b7280",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "16px",
};
