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
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface RateLimitNotificationEmailProps {
  blockedUntil: string;
  attemptCount: number;
}

export const RateLimitNotificationEmail = ({
  blockedUntil,
  attemptCount,
}: RateLimitNotificationEmailProps) => {
  const blockedUntilDate = new Date(blockedUntil);
  const formattedDate = blockedUntilDate.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Html>
      <Head />
      <Preview>Tentativas de recuperação de senha bloqueadas temporariamente</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <Img
              src="https://fupqwyzwjvlnklbazqjm.supabase.co/storage/v1/object/public/assets/soccer-squad-logo.jpeg"
              width="120"
              height="120"
              alt="Soccer Squad"
              style={logo}
            />
          </Section>
          
          <Heading style={h1}>🔒 Conta Temporariamente Bloqueada</Heading>
          
          <Text style={text}>
            Olá,
          </Text>
          
          <Text style={text}>
            Detectamos <strong>{attemptCount} tentativas</strong> de recuperação de senha 
            para sua conta no Soccer Squad em um curto período de tempo.
          </Text>
          
          <Section style={warningBox}>
            <Text style={warningText}>
              ⚠️ Por questões de segurança, temporariamente bloqueamos novas tentativas 
              de recuperação de senha para sua conta.
            </Text>
          </Section>
          
          <Text style={text}>
            <strong>Bloqueio válido até:</strong> {formattedDate}
          </Text>
          
          <Text style={text}>
            Se você reconhece essas tentativas, por favor aguarde até o horário indicado 
            acima e tente novamente.
          </Text>
          
          <Text style={text}>
            <strong>Se você não solicitou a recuperação de senha:</strong>
          </Text>
          
          <ul style={list}>
            <li style={listItem}>
              Alguém pode estar tentando acessar sua conta
            </li>
            <li style={listItem}>
              Recomendamos que você altere sua senha assim que possível
            </li>
            <li style={listItem}>
              Verifique a atividade recente da sua conta
            </li>
            <li style={listItem}>
              Entre em contato com nosso suporte se necessário
            </li>
          </ul>
          
          <Section style={buttonContainer}>
            <Link
              style={button}
              href="https://soccersquad.com.br"
            >
              Acessar Soccer Squad
            </Link>
          </Section>
          
          <Text style={footer}>
            Este é um email automático de segurança do Soccer Squad.
            <br />
            Não responda a este email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default RateLimitNotificationEmail;

// Styles
const main = {
  backgroundColor: "#0f1419",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  margin: "0 auto",
  borderRadius: "12px",
};

const h1 = {
  color: "#00ffff",
  fontSize: "28px",
  fontWeight: "700",
  margin: "30px 0",
  padding: "0",
  lineHeight: "1.3",
  textAlign: "center" as const,
};

const text = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
};

const warningBox = {
  backgroundColor: "rgba(255, 193, 7, 0.1)",
  border: "2px solid #ffc107",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const warningText = {
  color: "#ffc107",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
  fontWeight: "600",
};

const list = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0",
  paddingLeft: "20px",
};

const listItem = {
  marginBottom: "8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#00ffff",
  borderRadius: "8px",
  color: "#0f1419",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  transition: "all 0.3s ease",
};

const footer = {
  color: "#8b949e",
  fontSize: "14px",
  lineHeight: "24px",
  marginTop: "48px",
  textAlign: "center" as const,
};
