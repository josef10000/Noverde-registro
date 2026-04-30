import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { UserRole } from "../types";

export const startTour = (role: UserRole, onComplete: () => void) => {
  const isSupervisor = role === 'supervisor';

  const steps = [
    {
      element: '#user-profile-menu',
      popover: {
        title: 'Seu Perfil',
        description: 'Aqui você pode alterar seu nome, cargo e o tema do sistema.',
        position: 'bottom',
        align: 'end'
      }
    },
    {
      element: '#stats-grid',
      popover: {
        title: 'Métricas Principais',
        description: 'Acompanhe o total projetado, o valor efetivamente pago e o volume de acordos de hoje.',
        position: 'bottom'
      }
    },
    {
      element: '#overdue-card',
      popover: {
        title: 'Valores Vencidos',
        description: 'Fique de olho nos acordos que já passaram do vencimento e ainda não foram pagos.',
        position: 'bottom'
      }
    },
    {
      element: '#performance-chart',
      popover: {
        title: 'Gráfico de Metas',
        description: 'Visualize rapidamente o progresso em relação à meta mensal estabelecida.',
        position: 'top'
      }
    }
  ];

  if (isSupervisor) {
    steps.splice(1, 0, {
      element: '#team-selector',
      popover: {
        title: 'Gestão de Equipes',
        description: 'Como supervisor, você pode alternar entre suas equipes ou ver a visão macro de todas juntas.',
        position: 'bottom'
      }
    });

    steps.push({
      element: '#team-performance-module',
      popover: {
        title: 'Performance da Equipe',
        description: 'Acompanhe o ranking dos melhores operadores e a produtividade diária do time.',
        position: 'top'
      }
    });
  }

  steps.push({
    element: '#new-agreement-btn',
    popover: {
      title: 'Registrar Acordo',
      description: 'Sempre que fechar uma negociação, clique aqui para registrar no sistema.',
      position: 'left'
    }
  });

  const driverObj = driver({
    showProgress: true,
    steps: steps as any,
    overlayColor: 'rgba(2, 6, 23, 0.8)',
    nextBtnText: 'Próximo',
    prevBtnText: 'Anterior',
    doneBtnText: 'Entendi!',
    onDeselected: (element, step, { state }) => {
      // Se for o último passo, chama o onComplete
      if (state.activeIndex === steps.length - 1) {
        onComplete();
      }
    },
    onDestroyed: () => {
      // Caso o usuário feche no X ou clique fora, consideramos como visto
      onComplete();
    }
  });

  driverObj.drive();
};
