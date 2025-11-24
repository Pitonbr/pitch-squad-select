import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface PaymentReminderEmailProps {
  playerName: string;
  teamName: string;
  paymentType: "monthly" | "game";
  amount: number;
  dueDate?: string;
  periodMonth?: number;
  periodYear?: number;
  gameTitle?: string;
  gameDate?: string;
  paymentLink?: string;
}

export const PaymentReminderEmail = ({
  playerName,
  teamName,
  amount,
  paymentType,
  dueDate,
  periodMonth,
  periodYear,
  gameTitle,
  gameDate,
  paymentLink,
}: PaymentReminderEmailProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  const paymentDescription = paymentType === "monthly"
    ? `Mensalidade de ${getMonthName(periodMonth!)}/${periodYear}`
    : `Taxa do jogo: ${gameTitle}`;

  return (
    <Html>
      <Head />
      <Preview>
        Lembrete de Pagamento - {paymentDescription} - {formatCurrency(amount)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>⚽ Soccer Squad</Heading>
            <Text style={teamNameText}>{teamName}</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>💰 Lembrete de Pagamento</Heading>
            
            <Text style={text}>Olá {playerName},</Text>
            
            <Text style={text}>
              Este é um lembrete amigável sobre um pagamento pendente:
            </Text>

            <Section style={paymentCard}>
              <Text style={paymentTitle}>{paymentDescription}</Text>
              
              <Section style={amountSection}>
                <Text style={amountLabel}>Valor:</Text>
                <Text style={amountValue}>{formatCurrency(amount)}</Text>
              </Section>

              {dueDate && (
                <Text style={dueDateText}>
                  📅 <strong>Vencimento:</strong> {dueDate}
                </Text>
              )}

              {paymentType === "game" && gameDate && (
                <Text style={gameInfo}>
                  🕐 <strong>Data do Jogo:</strong> {gameDate}
                </Text>
              )}
            </Section>

            <Section style={infoBox}>
              <Text style={infoTitle}>💡 Como Pagar</Text>
              <Text style={infoText}>
                • Entre em contato com o tesoureiro do time<br />
                • Realize o pagamento via PIX, transferência ou dinheiro<br />
                • Confirme o pagamento com o administrador
              </Text>
            </Section>

            {paymentLink && (
              <Section style={buttonSection}>
                <Button href={paymentLink} style={button}>
                  Confirmar Pagamento
                </Button>
              </Section>
            )}

            <Text style={reminderText}>
              ⚠️ Mantenha suas contribuições em dia para continuar participando das atividades do time.
            </Text>

            <Text style={text}>
              Em caso de dúvidas, entre em contato com a administração do time.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Soccer Squad - Gestão Completa para Times de Futebol
            </Text>
            <Text style={footerText}>
              Este é um email automático, não responda.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentReminderEmail;

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "600px",
};

const header = {
  backgroundColor: "#1a1a1a",
  padding: "32px 24px",
  borderRadius: "12px 12px 0 0",
  textAlign: "center" as const,
};

const h1 = {
  color: "#00ffa3",
  fontSize: "32px",
  fontWeight: "bold",
  margin: "0 0 8px 0",
  textAlign: "center" as const,
};

const teamNameText = {
  color: "#00d9ff",
  fontSize: "16px",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  backgroundColor: "#1a1a1a",
  padding: "32px 24px",
};

const h2 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px 0",
};

const text = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const paymentCard = {
  backgroundColor: "#262626",
  border: "2px solid #ff9500",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const paymentTitle = {
  color: "#ff9500",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 20px 0",
};

const amountSection = {
  backgroundColor: "#1a1a1a",
  padding: "16px",
  borderRadius: "8px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const amountLabel = {
  color: "#a0a0a0",
  fontSize: "14px",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const amountValue = {
  color: "#00ffa3",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "0",
};

const dueDateText = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0 8px 0",
};

const gameInfo = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const infoBox = {
  backgroundColor: "#1a3a3a",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  borderLeft: "4px solid #00d9ff",
};

const infoTitle = {
  color: "#00d9ff",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const infoText = {
  color: "#e0e0e0",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#00ffa3",
  color: "#0a0a0a",
  padding: "14px 32px",
  borderRadius: "8px",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
};

const reminderText = {
  color: "#ff9500",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 16px 0",
  padding: "16px",
  backgroundColor: "#2a1a0a",
  borderRadius: "8px",
  borderLeft: "4px solid #ff9500",
};

const footer = {
  backgroundColor: "#1a1a1a",
  padding: "24px",
  borderRadius: "0 0 12px 12px",
  textAlign: "center" as const,
  borderTop: "1px solid #262626",
};

const footerText = {
  color: "#808080",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};
