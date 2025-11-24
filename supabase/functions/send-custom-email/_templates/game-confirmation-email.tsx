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

interface GameConfirmationEmailProps {
  playerName: string;
  gameTitle: string;
  gameDate: string;
  gameTime: string;
  gameLocation: string;
  confirmationStatus: "confirmed" | "declined";
  teamName: string;
}

export const GameConfirmationEmail = ({
  playerName,
  gameTitle,
  gameDate,
  gameTime,
  gameLocation,
  confirmationStatus,
  teamName,
}: GameConfirmationEmailProps) => {
  const isConfirmed = confirmationStatus === "confirmed";
  
  return (
    <Html>
      <Head />
      <Preview>
        {isConfirmed ? "Presença confirmada" : "Ausência registrada"} - {gameTitle}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>⚽ Soccer Squad</Heading>
            <Text style={teamNameText}>{teamName}</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>
              {isConfirmed ? "✅ Presença Confirmada!" : "❌ Ausência Registrada"}
            </Heading>
            
            <Text style={text}>Olá {playerName},</Text>
            
            <Text style={text}>
              {isConfirmed 
                ? "Sua presença foi confirmada para o jogo:"
                : "Registramos sua ausência para o jogo:"}
            </Text>

            <Section style={gameCard}>
              <Text style={gameTitle}>{gameTitle}</Text>
              <Text style={gameDetail}>
                📅 <strong>Data:</strong> {gameDate}
              </Text>
              <Text style={gameDetail}>
                🕐 <strong>Horário:</strong> {gameTime}
              </Text>
              <Text style={gameDetail}>
                📍 <strong>Local:</strong> {gameLocation}
              </Text>
            </Section>

            {isConfirmed && (
              <Text style={reminderText}>
                💪 Lembre-se de chegar com antecedência para o aquecimento!
              </Text>
            )}

            <Text style={text}>
              Caso precise alterar sua confirmação, acesse o aplicativo.
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

export default GameConfirmationEmail;

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

const gameCard = {
  backgroundColor: "#262626",
  border: "2px solid #00ffa3",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const gameTitle = {
  color: "#00ffa3",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0 0 16px 0",
};

const gameDetail = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const reminderText = {
  color: "#00d9ff",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 16px 0",
  padding: "16px",
  backgroundColor: "#1a3a3a",
  borderRadius: "8px",
  borderLeft: "4px solid #00d9ff",
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
