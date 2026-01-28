export interface Question {
  id: number;
  category: string;
  text: string;
  context: string; // Contexto para a IA
}

export const SURVEY_QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Cooperação no Time",
    text: "Conta pra gente: no seu dia a dia, as pessoas do seu time cooperam entre si para que o trabalho seja bem feito e entregue no prazo? Por quê?",
    context: "O usuário está falando sobre trabalho em equipe e colaboração."
  },
  {
    id: 2,
    category: "Satisfação na Bemol",
    text: "Em vídeo: o quanto você está satisfeito(a) em trabalhar na Bemol? Se recebesse outras propostas, você escolheria ficar aqui? O que mais pesa nessa decisão?",
    context: "O usuário está falando sobre retenção de talentos e satisfação pessoal."
  },
  {
    id: 3,
    category: "Cultura e Rapidez",
    text: "Como você busca entregar suas tarefas com rapidez e qualidade, seguindo a Cultura e o padrão de atendimento da Bemol? Dá um exemplo recente.",
    context: "O usuário está falando sobre eficiência operacional e cultura organizacional."
  },
  {
    id: 4,
    category: "Liderança",
    text: "Quando surge um problema que afeta a satisfação do cliente, como seu gestor(a) costuma agir? Ele(a) demonstra senso de urgência? Conta um caso.",
    context: "O usuário está avaliando a liderança e resolução de problemas."
  }
];