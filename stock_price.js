import fetch from 'node-fetch';
import iconv from 'iconv-lite';
import cheerio from 'cheerio';

// 이름으로 ticker 조회
export async function getStockTickers(name) {
  const encodedName = iconv.encode(name, 'euc-kr').toString('hex');
  var eName = ''
  for(var i=0;i<encodedName.length/2;i++) {
    eName = eName + '%' + encodedName.charAt(2*i) + encodedName.charAt(2*i+1)
  }
  const url = 'https://finance.naver.com/search/searchList.naver?query=' + eName;
  // console.log(url)
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.text();
    console.log(res.status);
    throw new Error(data);
  }
  const $ = cheerio.load(await res.text(), {decodeEntities: false});
  var result =  $(".tit").map((i, e) => {
    var text = e.children[0].attribs['href']
    return text.slice(text.length-6,text.length)
  });
  return Array.from(result);
}

// ticker로 시세조회
export async function getStockPriceAndUrI(ticker) {
  const url = 'https://finance.naver.com/item/main.naver?code=' + ticker;
  // console.log(url)
  const res = await fetch(url);
  if (!res.ok) {
    const data = await res.text();
    console.log(res.status);
    throw new Error(data);
  }
  const $ = cheerio.load(await res.text(), {decodeEntities: false});
  var result = $(".no_today").map((_, e) => {
    var t = cheerio.load(e)('.blind')
    return t[0].children[0].data
  })
  return {
    price: Array.from(result)[0],
    uri: url
  }
}
