const Bot = require('node-telegram-bot-api');
const sharp = require('sharp');
const request = require('request-promise');
const gm = require('gm');
const TELEGRAM_TOKEN = require('./config').token;
const bot = new Bot(TELEGRAM_TOKEN, { polling: true });

bot.on('message', message => {
  new Promise((resolve, reject) => {
  	if (message.photo) {
  		resolve(message.photo[message.photo.length - 1].file_id);
  	} else if (message.document && message.document.mime_type.indexOf('image/') === 0) {
  		resolve(message.document.file_id);
  	} else {
  		reject();
  	}
  })
  .then(fileId => {
  	return bot.getFile(fileId);
  })
  .then(file => {
	return request({
		url: `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`,
		resolveWithFullResponse: true,
		encoding: null
	});
  })
  .then(response => {
  	return new Promise((resolve, reject) => gm(response.body)
  		.transparent('#fff')
  		.toBuffer('PNG', (error, buffer) => {
	  		if (error) {
	  			reject(error);	
	  		} else {
	  			resolve(buffer);
	  		}
		}));
  })
  .then(buffer => {
  	return sharp(buffer)
  		.webp()
  		.toBuffer();
  })
  .then(buffer => {
  	return bot.sendDocument(message.chat.id, buffer);
  })
  .catch(e => {
  	console.error(e);
  	bot.sendMessage(message.chat.id, 'Пришли мне изображение которое нужно сконвертировать');
  });
});