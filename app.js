import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';
import {
  CHALLENGE_COMMAND,
  THREE_IDIOTS_COMMAND,
  TEST_COMMAND,
  STOCK_COMMAND,
  HasGuildCommands,
} from './commands.js';
import {
  getStockTickers,
  getStockPriceAndUrI
} from './stock_price.js';
import dotenv from 'dotenv'

dotenv.config()

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" guild command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          // Fetches a random emoji to send from a helper function
          content: 'hello world ' + getRandomEmoji(),
        },
      });
    } else if (name === 'three-idiots') {
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '세얼간이 화이팅' + getRandomEmoji(),
        },
      });
    } else if (name === 'stock') {
      const nameOption = data.options.find(e => e.name === 'name')
      const { value } = nameOption

      var stockName = value
      var tickers = await getStockTickers(value)

      if(tickers.length <= 0) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '검색명 : ' + stockName + ' 매칭되는 종목이 없습니다.',
          },
        });
      }
      // 최상단 티커만 사용
      var { price, uri } = await getStockPriceAndUrI(tickers[0])
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '검색명 : ' + stockName + ' / 티커 : ' + tickers[0] + ' / 가격 : ' + price + ' / 링크 : ' + uri,
        },
      });
    }
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  // Check if guild commands from commands.json are installed (if not, install them)
  HasGuildCommands(process.env.APP_ID, process.env.GUILD_ID, [
    TEST_COMMAND,
    THREE_IDIOTS_COMMAND,
    CHALLENGE_COMMAND,
    STOCK_COMMAND,
  ]);
});