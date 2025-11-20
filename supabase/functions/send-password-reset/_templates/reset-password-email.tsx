import {
  Body,
  Button,
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

interface ResetPasswordEmailProps {
  resetLink: string;
}

export const ResetPasswordEmail = ({
  resetLink = "https://example.com/reset-password",
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Redefinição de Senha - Soccer Squad</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://fupqwyzwjvlnklbazqjm.supabase.co/storage/v1/object/public/assets/soccer-squad-logo.jpeg"
            width="80"
            height="80"
            alt="Soccer Squad"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Redefinição de Senha</Heading>
        
        <Text style={text}>
          Olá! Recebemos uma solicitação para redefinir a senha da sua conta no Soccer Squad.
        </Text>
        
        <Text style={text}>
          Clique no botão abaixo para criar uma nova senha. Este link expira em <strong>1 hora</strong>.
        </Text>
        
        <Section style={buttonContainer}>
          <Button style={button} href={resetLink}>
            Redefinir Minha Senha
          </Button>
        </Section>
        
        <Text style={text}>
          Ou copie e cole este link no seu navegador:
        </Text>
        
        <Text style={linkText}>
          <Link href={resetLink} style={link}>
            {resetLink}
          </Link>
        </Text>
        
        <Section style={warningSection}>
          <Text style={warningText}>
            ⚠️ <strong>Segurança:</strong> Se você não solicitou a redefinição de senha, 
            ignore este email. Sua senha permanecerá a mesma e nenhuma alteração será feita na sua conta.
          </Text>
        </Section>
        
        <Text style={footer}>
          Soccer Squad - Gestão completa do seu time de futebol
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ResetPasswordEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logo = {
  borderRadius: "50%",
  margin: "0 auto",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#484848",
  fontSize: "16px",
  lineHeight: "26px",
  marginBottom: "16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3FB8AF",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
  boxShadow: "0 4px 6px rgba(63, 184, 175, 0.3)",
};

const linkText = {
  fontSize: "14px",
  color: "#484848",
  marginTop: "16px",
  wordBreak: "break-all" as const,
};

const link = {
  color: "#3FB8AF",
  textDecoration: "underline",
};

const warningSection = {
  backgroundColor: "#FFF4E6",
  borderLeft: "4px solid #FFB020",
  padding: "16px",
  marginTop: "32px",
  borderRadius: "4px",
};

const warningText = {
  color: "#484848",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

const footer = {
  color: "#9ca299",
  fontSize: "14px",
  textAlign: "center" as const,
  marginTop: "32px",
};
