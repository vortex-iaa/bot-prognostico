require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const fetch = require('node-fetch');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const API_KEY = process.env.API_FOOTBALL_KEY;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.onText(/\/prognostico (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const time = match[1];

  bot.sendMessage(chatId, `🔎 Buscando prognóstico para: *${time}*...`, { parse_mode: 'Markdown' });

  try {
    const teamData = await fetch(`https://v3.football.api-sports.io/teams?search=${time}`, {
      method: 'GET',
      headers: { 'x-apisports-key': API_KEY }
    }).then(res => res.json());

    if (teamData.response.length === 0) {
      bot.sendMessage(chatId, '❌ Time não encontrado.');
      return;
    }

    const teamId = teamData.response[0].team.id;

    const matchesData = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&last=5`, {
      method: 'GET',
      headers: { 'x-apisports-key': API_KEY }
    }).then(res => res.json());

    const jogos = matchesData.response;
    let totalGols = 0;
    jogos.forEach(jogo => {
      totalGols += jogo.goals.home + jogo.goals.away;
    });

    const mediaGols = (totalGols / jogos.length).toFixed(2);
    const recomendacao = mediaGols > 2.5 ? "Alta probabilidade de Over 2.5 gols." : "Tendência de poucos gols.";

    bot.sendMessage(chatId, `
📊 *Prognóstico para ${time}*
- Média de gols: *${mediaGols}* por jogo.

🧠 ${recomendacao}
    `, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Erro ao buscar as informações.');
  }
});
