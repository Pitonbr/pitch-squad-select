import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface GameSummaryEmailProps {
  playerName: string;
  gameTitle: string;
  gameDate: string;
  finalScore: string;
  teamName: string;
  playerStats?: {
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
  };
  topScorers?: Array<{
    name: string;
    goals: number;
  }>;
  matchHighlights?: string[];
}

export const GameSummaryEmail = ({
  playerName,
  gameTitle,
  gameDate,
  finalScore,
  teamName,
  playerStats,
  topScorers,
  matchHighlights,
}: GameSummaryEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Resumo do jogo: {gameTitle} - {finalScore}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>⚽ Soccer Squad</Heading>
            <Text style={teamNameText}>{teamName}</Text>
          </Section>

          <Section style={content}>
            <Heading style={h2}>📊 Resumo do Jogo</Heading>
            
            <Text style={text}>Olá {playerName},</Text>
            
            <Text style={text}>
              Confira o resumo do jogo que aconteceu em {gameDate}:
            </Text>

            <Section style={scoreCard}>
              <Text style={gameTitle}>{gameTitle}</Text>
              <Text style={finalScoreText}>{finalScore}</Text>
            </Section>

            {playerStats && (
              <Section style={statsSection}>
                <Heading style={h3}>Suas Estatísticas</Heading>
                <Section style={statsGrid}>
                  {playerStats.goals !== undefined && playerStats.goals > 0 && (
                    <Text style={statItem}>
                      ⚽ <strong>{playerStats.goals}</strong> {playerStats.goals === 1 ? 'Gol' : 'Gols'}
                    </Text>
                  )}
                  {playerStats.assists !== undefined && playerStats.assists > 0 && (
                    <Text style={statItem}>
                      🎯 <strong>{playerStats.assists}</strong> {playerStats.assists === 1 ? 'Assistência' : 'Assistências'}
                    </Text>
                  )}
                  {playerStats.yellowCards !== undefined && playerStats.yellowCards > 0 && (
                    <Text style={statItem}>
                      🟨 <strong>{playerStats.yellowCards}</strong> {playerStats.yellowCards === 1 ? 'Cartão Amarelo' : 'Cartões Amarelos'}
                    </Text>
                  )}
                  {playerStats.redCards !== undefined && playerStats.redCards > 0 && (
                    <Text style={statItem}>
                      🟥 <strong>{playerStats.redCards}</strong> {playerStats.redCards === 1 ? 'Cartão Vermelho' : 'Cartões Vermelhos'}
                    </Text>
                  )}
                </Section>
              </Section>
            )}

            {topScorers && topScorers.length > 0 && (
              <Section style={scorersSection}>
                <Heading style={h3}>🏆 Artilheiros do Jogo</Heading>
                {topScorers.map((scorer, index) => (
                  <Text key={index} style={scorerItem}>
                    {index + 1}. <strong>{scorer.name}</strong> - {scorer.goals} {scorer.goals === 1 ? 'gol' : 'gols'}
                  </Text>
                ))}
              </Section>
            )}

            {matchHighlights && matchHighlights.length > 0 && (
              <Section style={highlightsSection}>
                <Heading style={h3}>⭐ Destaques da Partida</Heading>
                {matchHighlights.map((highlight, index) => (
                  <Text key={index} style={highlightItem}>
                    • {highlight}
                  </Text>
                ))}
              </Section>
            )}

            <Text style={text}>
              Continue acompanhando suas estatísticas e próximos jogos no aplicativo!
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

export default GameSummaryEmail;

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

const h3 = {
  color: "#00ffa3",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "24px 0 16px 0",
};

const text = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const scoreCard = {
  backgroundColor: "#262626",
  border: "2px solid #00ffa3",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const gameTitle = {
  color: "#e0e0e0",
  fontSize: "18px",
  margin: "0 0 16px 0",
};

const finalScoreText = {
  color: "#00ffa3",
  fontSize: "36px",
  fontWeight: "bold",
  margin: "0",
};

const statsSection = {
  backgroundColor: "#1a3a3a",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  borderLeft: "4px solid #00d9ff",
};

const statsGrid = {
  margin: "16px 0",
};

const statItem = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "32px",
  margin: "8px 0",
};

const scorersSection = {
  backgroundColor: "#262626",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const scorerItem = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "8px 0",
};

const highlightsSection = {
  backgroundColor: "#262626",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const highlightItem = {
  color: "#e0e0e0",
  fontSize: "16px",
  lineHeight: "28px",
  margin: "8px 0",
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
