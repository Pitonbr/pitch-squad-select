import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Button,
  Img,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface WelcomeEmailProps {
  confirmationUrl: string;
  displayName: string;
}

export const WelcomeEmail = ({
  confirmationUrl,
  displayName,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirme seu cadastro no Soccer Squad</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://fupqwyzwjvlnklbazqjm.supabase.co/storage/v1/object/public/assets/soccer-squad-logo.jpeg"
            alt="Soccer Squad Logo"
            width="120"
            height="120"
            style={logoImage}
          />
          <Heading style={h1}>Soccer Squad</Heading>
        </Section>
        
        <Section style={content}>
          <Heading style={h2}>Bem-vindo, {displayName}!</Heading>
          <Text style={text}>
            Obrigado por se cadastrar no Soccer Squad, o aplicativo definitivo para gerenciar seu time de futebol!
          </Text>
          
          <Text style={text}>
            Para completar seu cadastro e começar a usar todas as funcionalidades do app, 
            clique no botão abaixo para confirmar seu email:
          </Text>
          
          <Section style={buttonContainer}>
            <Button
              href={confirmationUrl}
              style={button}
            >
              Confirmar Cadastro
            </Button>
          </Section>
          
          <Text style={smallText}>
            Ou copie e cole este link no seu navegador:
          </Text>
          <Text style={linkText}>
            {confirmationUrl}
          </Text>
          
          <Text style={smallText}>
            Se você não se cadastrou no Soccer Squad, pode ignorar este email com segurança.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © 2025 Soccer Squad - Gerencie seu time com facilidade
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  textAlign: 'center' as const,
  padding: '32px 0',
};

const logoImage = {
  margin: '0 auto 16px',
  borderRadius: '12px',
};

const h1 = {
  color: '#3FB8AF',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 48px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '32px 0 24px',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3FB8AF',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
};

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0 8px',
  textAlign: 'center' as const,
};

const linkText = {
  color: '#3FB8AF',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const footer = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
  paddingTop: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};