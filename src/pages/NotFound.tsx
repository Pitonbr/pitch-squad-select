import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import soccerFieldHero from "@/assets/soccer-field-hero.jpg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(26, 46, 61, 0.85), rgba(10, 20, 30, 0.9)), url(${soccerFieldHero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <Card variant="dark" className="w-full max-w-md text-center backdrop-blur-md">
        <CardContent className="p-8">
          <div className="mb-6">
            <h1 className="text-6xl font-bold text-white mb-4" style={{ textShadow: '0 0 25px rgba(63, 184, 175, 0.5)' }}>
              404
            </h1>
            <p className="text-xl text-cyan-100 mb-2">
              Página não encontrada
            </p>
            <p className="text-white/70">
              A página que você procura não existe
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = '/'} 
            className="w-full bg-primary hover:bg-accent text-white"
          >
            Voltar para o Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
