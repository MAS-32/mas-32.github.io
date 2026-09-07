export const GREETINGS = [
 {language:'English',text:'Hello',lang:'en',dir:'ltr'},
 {language:'Spanish',text:'Hola',lang:'es',dir:'ltr'},
 {language:'French',text:'Bonjour',lang:'fr',dir:'ltr'},
 {language:'Arabic',text:'مرحبًا',lang:'ar',dir:'rtl'},
 {language:'Russian',text:'Привет',lang:'ru',dir:'ltr'},
 {language:'Portuguese',text:'Olá',lang:'pt',dir:'ltr'},
 {language:'German',text:'Hallo',lang:'de',dir:'ltr'},
 {language:'Japanese',text:'こんにちは',lang:'ja',dir:'ltr'},
 {language:'Korean',text:'안녕하세요',lang:'ko',dir:'ltr'},
 {language:'Hindi',text:'नमस्ते',lang:'hi',dir:'ltr'},
 {language:'Italian',text:'Ciao',lang:'it',dir:'ltr'},
 {language:'Turkish',text:'Merhaba',lang:'tr',dir:'ltr'},
 {language:'Indonesian',text:'Halo',lang:'id',dir:'ltr'},
 {language:'Vietnamese',text:'Xin chào',lang:'vi',dir:'ltr'},
 {language:'Mandarin Chinese',text:'你好',lang:'zh-CN',dir:'ltr'}
];
export const INTRO_TIMING={first:750,early:200,middle:150,late:110,last:940,curtain:820,reduced:420,heroOverlap:330};
export function getGreetingDuration(index){if(index===0)return INTRO_TIMING.first;if(index<=4)return INTRO_TIMING.early;if(index<=9)return INTRO_TIMING.middle;if(index<=13)return INTRO_TIMING.late;return INTRO_TIMING.last;}
export const GREETING_TOTAL=GREETINGS.reduce((sum,_,i)=>sum+getGreetingDuration(i),0);
export function curtainPath(width,height,bulge=0){return `M0 0 L${width} 0 L${width} ${height} Q${width/2} ${height+bulge} 0 ${height} L0 0`;}
