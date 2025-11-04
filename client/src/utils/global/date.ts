export function preZero(num: number) {
  if (num < 10) {
    return '0' + num;
  }

  return num.toString();
}

type DateFormat = 'hh:mm' | 'yyyy-mm-dd hh:mm' | 'mm-dd hh:mm';

export function formatDate(pubTime: number, format?: DateFormat) {
  const pubDate = new Date(pubTime);
  const curDate = new Date();
  curDate.setHours(0, 0, 0, 0);
  const gapStamp = pubDate.getTime() - curDate.getTime();
  const curYear = curDate.getFullYear();
  const pubYear = pubDate.getFullYear();
  const pubMonth = pubDate.getMonth() + 1;
  const pubDay = pubDate.getDate();

  if (!format) {
    if (gapStamp >= 0) {
      return getToday(pubTime);
    }
  
    if (curYear !== pubYear) {
      return `${pubYear}年${pubMonth}月${pubDay}日`;
    }
  
    return `${pubMonth}月${pubDay}日`;
  }
  
  const h = preZero(pubDate.getHours());
  const m = preZero(pubDate.getMinutes());

  if (format === 'mm-dd hh:mm') {
    return `${preZero(pubMonth)}-${preZero(pubDay)} ${h}:${m}`;
  }
  else if (format === 'yyyy-mm-dd hh:mm') {
    return `${pubYear}-${preZero(pubMonth)}-${preZero(pubDay)} ${h}:${m}`;
  }

  return `${h}:${m}`;
}

export function groupChatDate(pubTime: number) {
  const pubDate = new Date(pubTime);
  const curDate = new Date();
  curDate.setHours(0, 0, 0, 0);
  const gapStamp = pubDate.getTime() - curDate.getTime();
  const curYear = curDate.getFullYear();
  const pubYear = pubDate.getFullYear();
  const pubMonth = pubDate.getMonth() + 1;
  const pubDay = pubDate.getDate();
  const h = preZero(pubDate.getHours());
  const m = preZero(pubDate.getMinutes());
  const hm = `${h}:${m}`;

  if (gapStamp >= 0) {
    return hm;
  }

  if (curYear !== pubYear) {
    return `${pubYear}年${pubMonth}月${pubDay}日 ${hm}`;
  }

  return `${pubMonth}月${pubDay}日 ${hm}`;
}

export function getToday(pubTime: number) {
  const date = new Date(pubTime);

  const h = date.getHours();
  const m = preZero(date.getMinutes());

  return `${h}:${m}`;
}

export function getDate(pubTime: number) {
  const pubDate = new Date(pubTime);
  const pubYear = pubDate.getFullYear();
  const pubMonth = pubDate.getMonth() + 1;
  const pubDay = pubDate.getDate();
 
  return `${pubYear}年${preZero(pubMonth)}月${preZero(pubDay)}日`;
}
