'use client';
import { useState, useEffect, useRef } from 'react';
import { Engine } from '@/engine/engine';

/* ════════════════════════════════════════════════════════════
   CHARACTERS
   ════════════════════════════════════════════════════════════ */
const CHARS = [
  { id:'leader', name:'Rabbi David', role:'Seder Leader', seat:{x:500,y:235}, color:'#F5F0DC', hair:'#AAA', skin:'#C9A87C', gender:'M', age:'elder', kippah:true, beard:true, pitch:0.7, voiceId:'TxGEqnHWrfWFTfGW9XjX' },
  { id:'mother', name:'Shira', role:'Mom', seat:{x:280,y:290}, color:'#7B3F7B', hair:'#4A2F1C', skin:'#D2A679', gender:'F', age:'adult', pitch:1.05, voiceId:'21m00Tcm4TlvDq8ikWAM' },
  { id:'father', name:'Avi', role:'Dad', seat:{x:720,y:290}, color:'#2F4F4F', hair:'#3B2F1C', skin:'#BE8C63', gender:'M', age:'adult', kippah:true, pitch:0.85, voiceId:'ErXwobaYiN019PkySvjV' },
  { id:'savta', name:'Savta Esther', role:'Grandma', seat:{x:240,y:380}, color:'#8B2040', hair:'#C0C0C0', skin:'#C9A87C', gender:'F', age:'elder', pitch:0.9, voiceId:'MF3mGyEYCl7XYWbV9V6O' },
  { id:'saba', name:'Saba Yosef', role:'Grandpa', seat:{x:760,y:380}, color:'#2C2C54', hair:'#AAA', skin:'#C49B6C', gender:'M', age:'elder', kippah:true, beard:true, pitch:0.65, voiceId:'VR6AewLTigWG4xSOukaG' },
  { id:'child_young', name:'Noa', role:'8 yrs', seat:{x:280,y:470}, color:'#E85D9A', hair:'#5C3317', skin:'#DEB887', gender:'F', age:'child', pitch:1.7, voiceId:'EXAVITQu4vr4xnSDxMaL' },
  { id:'child_wise', name:'Yael', role:'16 yrs', seat:{x:720,y:470}, color:'#2E8B57', hair:'#3B2F1C', skin:'#D2A679', gender:'F', age:'teen', pitch:1.25, voiceId:'AZnzlk1XvdvUeBnXmlld' },
  { id:'child_wicked', name:'Dani', role:'15 yrs', seat:{x:240,y:500}, color:'#222', hair:'#2B1F14', skin:'#BE8C63', gender:'M', age:'teen', pitch:1.15, voiceId:'pNInz6obpgDQGcFmaJgB' },
  { id:'child_simple', name:'Eli', role:'6 yrs', seat:{x:760,y:500}, color:'#3A6BC5', hair:'#7A4E2D', skin:'#DEB887', gender:'M', age:'child', kippah:true, pitch:1.6, voiceId:'EXAVITQu4vr4xnSDxMaL' },
  { id:'uncle', name:'Dod Moshe', role:'Uncle', seat:{x:260,y:440}, color:'#4A6B2F', hair:'#2B1F14', skin:'#C49B6C', gender:'M', age:'adult', kippah:true, pitch:0.9, voiceId:'TxGEqnHWrfWFTfGW9XjX' },
  { id:'aunt', name:'Doda Leah', role:'Aunt', seat:{x:740,y:440}, color:'#B8860B', hair:'#8B4513', skin:'#BE8C63', gender:'F', age:'young', pitch:1.15, voiceId:'21m00Tcm4TlvDq8ikWAM' },
  { id:'guest', name:'Ben', role:'Guest', seat:{x:500,y:560}, color:'#607080', hair:'#463E2E', skin:'#D2A679', gender:'M', age:'young', kippah:true, pitch:1.0, voiceId:'ErXwobaYiN019PkySvjV' },
];
const CM = Object.fromEntries(CHARS.map(c=>[c.id,c]));

/* ════════════════════════════════════════════════════════════
   SEDER SCRIPT
   ════════════════════════════════════════════════════════════ */
const SCRIPT = [
  {act:'move',who:'mother',to:{x:160,y:100},dur:1500},{act:'move',who:'mother',to:{x:280,y:290},dur:1500},
  {say:'mother',en:"Everyone SIT DOWN, we're starting!",dur:3000},
  {say:'child_wicked',en:"Let me charge my phone first.",dur:2500},
  {say:'father',en:"Dani. Phone. Now.",dur:2000},
  {say:'child_young',en:"Mommy I'm SO hungry!",dur:2000},
  {say:'guest',en:"Is there... assigned seating?",dur:2500},
  {say:'aunt',en:"Ben, sit next to me. I'll explain everything.",dur:3000},
  {say:'saba',en:"What? We're starting?",dur:2000},

  {phase:'קַדֵּשׁ · Kadesh — Sanctification'},
  {act:'stand',who:'leader'},
  {say:'leader',en:"Blessed are You, Lord our God, King of the universe, who creates the fruit of the vine.",he:"בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.",dur:7000},
  {say:'leader',en:"Blessed are You, Lord our God, who has chosen us from all peoples, exalted us above all tongues, and sanctified us with His commandments.",he:"בָּרוּךְ אַתָּה ה׳, אֲשֶׁר בָּחַר בָּנוּ מִכָּל עָם, וְרוֹמְמָנוּ מִכָּל לָשׁוֹן, וְקִדְּשָׁנוּ בְּמִצְוֹתָיו.",dur:10000},
  {say:'leader',en:"Blessed are You, Lord, who has kept us alive and brought us to this season.",he:"בָּרוּךְ אַתָּה ה׳, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.",dur:6000},
  {act:'drink'},{act:'sit',who:'leader'},
  {react:true, ctx:'Everyone just drank the first cup of wine. It is strong.', chars:['uncle','child_wicked','savta','guest'], max:2},

  {phase:'וּרְחַץ · Urchatz — Washing'},
  {say:'leader',en:"We wash our hands without a blessing.",dur:3500},
  {react:true, ctx:'The leader washed hands WITHOUT a blessing. This is unusual and meant to provoke questions.', chars:['guest','child_simple','child_wise','child_wicked'], max:2},

  {phase:'כַּרְפַּס · Karpas — Green Vegetable'},
  {say:'leader',en:"Blessed are You, Lord our God, who creates the fruit of the earth.",he:"בָּרוּךְ אַתָּה ה׳, בּוֹרֵא פְּרִי הָאֲדָמָה.",dur:6000},
  {act:'eat'},
  {react:true, ctx:'Everyone ate parsley dipped in salt water. Very salty. Represents tears of slaves.', chars:['child_young','guest','mother','child_simple'], max:2},

  {phase:'יַחַץ · Yachatz — Breaking the Matzah'},
  {act:'stand',who:'leader'},
  {say:'leader',en:"This is the bread of affliction our ancestors ate in Egypt. All who are hungry — come and eat.",he:"הָא לַחְמָא עַנְיָא דִי אֲכָלוּ אַבְהָתָנָא. כָּל דִכְפִין יֵיתֵי וְיֵכוֹל.",dur:10000},
  {say:'leader',en:"Now we are here — next year in Israel. Now slaves — next year free.",he:"הָשַׁתָּא הָכָא, לְשָׁנָה הַבָּאָה בְּאַרְעָא דְיִשְׂרָאֵל.",dur:7000},
  {act:'sit',who:'leader'},
  {act:'move',who:'father',to:{x:850,y:160},dur:1000},{act:'move',who:'father',to:{x:720,y:290},dur:1000},
  {say:'child_young',en:"I saw where you put it!",dur:2000},{say:'father',en:"No you didn't.",dur:1500},

  {phase:'מַגִּיד · Maggid — The Telling'},
  {say:'mother',en:"Noa, your turn!",dur:2000},
  {act:'stand',who:'child_young'},
  {say:'child_young',en:"Why is this night different from all other nights?",he:"מַה נִּשְׁתַּנָּה הַלַּיְלָה הַזֶּה מִכָּל הַלֵּילוֹת?",dur:6000},
  {say:'child_young',en:"On all other nights we eat bread or matzah — why tonight only matzah?",he:"שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין חָמֵץ וּמַצָּה, הַלַּיְלָה הַזֶּה כֻּלּוֹ מַצָּה.",dur:7000},
  {say:'child_young',en:"On all other nights we eat all vegetables — why tonight bitter herbs?",he:"שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין שְׁאָר יְרָקוֹת, הַלַּיְלָה הַזֶּה מָרוֹר.",dur:7000},
  {say:'child_young',en:"On all other nights we don't dip even once — why tonight twice?",he:"שֶׁבְּכָל הַלֵּילוֹת אֵין אָנוּ מַטְבִּילִין אֲפִילוּ פַּעַם אֶחָת, הַלַּיְלָה הַזֶּה שְׁתֵּי פְעָמִים.",dur:7000},
  {say:'child_young',en:"On all other nights we eat sitting or reclining — why tonight do we all recline?",he:"שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין בֵּין יוֹשְׁבִין וּבֵין מְסֻבִּין, הַלַּיְלָה הַזֶּה כֻּלָּנוּ מְסֻבִּין.",dur:7000},
  {act:'sit',who:'child_young'},
  {react:true, ctx:'Noa (age 8) just finished singing all four questions beautifully. The whole table is proud.', chars:['savta','saba','guest','mother','child_wicked'], max:3},

  {say:'leader',en:"We were slaves to Pharaoh in Egypt, and the Lord our God brought us out with a strong hand.",he:"עֲבָדִים הָיִינוּ לְפַרְעֹה בְּמִצְרָיִם, וַיּוֹצִיאֵנוּ ה׳ אֱלֹהֵינוּ מִשָּׁם בְּיָד חֲזָקָה.",dur:10000},
  {react:true, ctx:'The leader just said "We were slaves in Egypt." Heavy moment.', chars:['child_wicked','savta','father','guest'], max:2},

  {say:'leader',en:"The Torah speaks of four children: wise, rebellious, simple, and one who cannot ask.",he:"כְּנֶגֶד אַרְבָּעָה בָנִים דִּבְּרָה תוֹרָה.",dur:7000},
  {act:'stand',who:'child_wise'},{say:'child_wise',en:"The Wise Child asks: What are the laws God has commanded?",dur:5000},{act:'sit',who:'child_wise'},
  {act:'stand',who:'child_wicked'},{say:'child_wicked',en:"The Rebellious Child says: What does this mean to YOU? Not me.",dur:5000},
  {say:'leader',en:"It is because of what God did for ME — not for you.",dur:4000},
  {react:true, ctx:'The rebellious teen (Dani, 15) was told the Haggadah says he would not have been redeemed. The aunt is watching with fascination.', chars:['child_wicked','aunt','child_wise'], max:2},
  {act:'sit',who:'child_wicked'},
  {say:'child_simple',en:"What is this?",dur:2000},
  {say:'leader',en:"With a strong hand God brought us out of Egypt.",dur:4000},

  {say:'leader',en:"In every generation they rise to destroy us — and the Holy One saves us.",he:"וְהִיא שֶׁעָמְדָה. שֶׁבְּכָל דּוֹר וָדוֹר עוֹמְדִים עָלֵינוּ לְכַלּוֹתֵנוּ, וְהַקָּדוֹשׁ בָּרוּךְ הוּא מַצִּילֵנוּ מִיָּדָם.",dur:11000},
  {react:true, ctx:'V\'hi She\'amda — "In every generation they rise to destroy us." One of the most emotional moments. The grandmother is thinking of the Holocaust.', chars:['savta','guest','saba','child_wicked'], max:2},

  {say:'leader',en:"The ten plagues. For each, we spill a drop of wine:",dur:4000},
  ...['Blood!','Frogs!','Lice!','Wild Beasts!','Pestilence!','Boils!','Hail!','Locusts!','Darkness!','Death of the Firstborn!'].map(p=>({say:'all',en:p,dur:1800})),
  {react:true, ctx:'We just listed all ten plagues while spilling wine. The leader explains we diminish joy because others suffered.', chars:['guest','child_simple','child_wicked','leader'], max:2},

  {say:'all',en:"Had He brought us out of Egypt — DAYENU!",he:"אִלּוּ הוֹצִיאָנוּ מִמִּצְרַיִם — דַּיֵּנוּ!",dur:4000},
  {say:'all',en:"Had He given us the Torah — DAYENU!",dur:3500},
  {say:'all',en:"Had He brought us to Israel — DAYENU!",dur:3500},
  {react:true, ctx:'Everyone just sang Dayenu with energy. Uncle Moshe was loudest. The rebellious teen was caught singing along. The guest is clapping.', chars:['uncle','child_wicked','guest','mother'], max:2},
  {act:'drink'},

  {phase:'רָחְצָה · מוֹצִיא מַצָּה'},
  {say:'leader',en:"Blessed are You, Lord, who brings forth bread from the earth.",he:"בָּרוּךְ אַתָּה ה׳, הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ.",dur:6000},
  {act:'eat'},
  {react:true, ctx:'Everyone is eating dry matzah. The grandfather thinks it needs salt. The grandmother compares it to hers.', chars:['saba','savta','child_wicked','guest'], max:2},

  {phase:'מָרוֹר · Maror — Bitter Herb'},
  {say:'leader',en:"Blessed are You, Lord, who commanded us to eat bitter herbs.",he:"בָּרוּךְ אַתָּה ה׳, וְצִוָּנוּ עַל אֲכִילַת מָרוֹר.",dur:6000},
  {act:'eat'},
  {react:true, ctx:'Everyone just ate raw horseradish (maror). VERY spicy. Eyes watering. The guest was NOT prepared. The grandfather ate it without flinching.', chars:['child_young','guest','saba','savta','uncle'], max:3},

  {phase:'כּוֹרֵךְ · Korech — Hillel Sandwich'},
  {say:'leader',en:"As Hillel did: matzah and bitter herbs together.",dur:5000},
  {react:true, ctx:'Everyone eating the Hillel sandwich. Hillel invented the sandwich 2000 years before the Earl of Sandwich.', chars:['child_wicked','child_wise','guest'], max:2},

  {phase:'שֻׁלְחָן עוֹרֵךְ · THE MEAL!'},
  {react:true, ctx:'THE MEAL IS FINALLY BEING SERVED! Kids have been waiting hours. Grandmother already serving soup.', chars:['child_young','child_simple','savta','uncle'], max:3},
  {act:'move',who:'mother',to:{x:160,y:100},dur:1200},{act:'move',who:'aunt',to:{x:160,y:130},dur:1200},
  {act:'move',who:'mother',to:{x:280,y:290},dur:1200},{act:'move',who:'aunt',to:{x:740,y:440},dur:1200},
  {act:'eat'},
  {react:true, ctx:'During the meal. Grandmother pushing food on everyone. Grandfather has fallen asleep in his chair. Someone wants more soup.', chars:['savta','saba','uncle','mother','father'], max:3},
  {react:true, ctx:'Saba Yosef has been sleeping. The teen is thinking of pranking him. Father telling a story nobody asked for.', chars:['saba','child_wicked','father','aunt'], max:2},

  {phase:'צָפוּן · Tzafun — Afikoman Hunt!'},
  {react:true, ctx:'Time to find the Afikoman! The father hid it. Kids about to search. Noa (8) is VERY competitive. Eli (6) never wins.', chars:['father','child_young','child_simple'], max:2},
  {act:'move',who:'child_young',to:{x:850,y:140},dur:800},
  {act:'move',who:'child_simple',to:{x:160,y:500},dur:800},
  {act:'move',who:'child_young',to:{x:850,y:170},dur:500},
  {react:true, ctx:'Noa found the Afikoman! She is negotiating her prize. Always starts with iPad, settles for ice cream. Other kids jealous.', chars:['child_young','father','mother','child_simple','child_wicked'], max:3},
  {act:'move',who:'child_young',to:{x:280,y:470},dur:1000},{act:'move',who:'child_simple',to:{x:760,y:500},dur:1000},

  {phase:'בָּרֵךְ · Barech — Elijah'},
  {say:'leader',en:"Blessed are You, Lord, who sustains the world with goodness.",dur:6000},
  {act:'drink'},
  {act:'stand',who:'leader'},
  {say:'leader',en:"Open the door for Elijah the Prophet!",dur:3500},
  {act:'door'},
  {react:true, ctx:'The door opened for Elijah. Candles flickered. Everyone watching the golden cup to see if it moves. Magical moment for children.', chars:['child_simple','savta','guest','child_young'], max:2},
  {say:'all',en:"Elijah the Prophet — may he come speedily in our days!",he:"אֵלִיָּהוּ הַנָּבִיא, בִּמְהֵרָה בְיָמֵינוּ יָבוֹא אֵלֵינוּ.",dur:8000},
  {act:'sit',who:'leader'},

  {phase:'הַלֵּל · Hallel — Songs of Praise!'},
  {say:'all',en:"Give thanks to the Lord for He is good!",he:"הוֹדוּ לַה׳ כִּי טוֹב!",dur:4000},
  {act:'drink'},
  {say:'all',en:"One little goat that father bought for two zuzim!",he:"חַד גַּדְיָא!",dur:5000},
  {react:true, ctx:'Everyone singing Chad Gadya. Uncle Moshe banging on table. Even the teen is singing. Guest trying to sing phonetically.', chars:['uncle','child_wicked','guest','child_young'], max:2},

  {phase:'נִרְצָה · Next Year in Jerusalem!'},
  {act:'stand',who:'all'},
  {say:'leader',en:"The Seder is complete. As we merited to perform it, so may we do it again.",he:"חֲסַל סִדּוּר פֶּסַח כְּהִלְכָתוֹ. כַּאֲשֶׁר זָכִינוּ לְסַדֵּר אוֹתוֹ, כֵּן נִזְכֶּה לַעֲשׂוֹתוֹ.",dur:9000},
  {say:'all',en:"NEXT YEAR IN JERUSALEM!",he:"לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם!",dur:5000},
  {react:true, ctx:'The Seder is over! Everyone hugging, laughing, exhausted. Youngest wants her ice cream prize. Grandfather claims it went fast. Guest is deeply moved.', chars:['child_young','saba','savta','guest','mother','child_wicked'], max:3},
  {act:'end'}
];

/* ════════════════════════════════════════════════════════════
   SVG ROOM — richly detailed
   ════════════════════════════════════════════════════════════ */
function Room({ doorOpen }) {
  return <g>
    {/* ── FLOOR ── */}
    <rect x={0} y={0} width={1000} height={700} fill="#22190E"/>
    {/* Hardwood floor planks */}
    {Array.from({length:18}).map((_,i)=><rect key={i} x={0} y={i*40} width={1000} height={39} fill={i%2?'#2A1E12':'#2E2114'} stroke="#1E160C" strokeWidth={0.5}/>)}

    {/* ── WALLS ── */}
    <rect x={0} y={0} width={1000} height={70} fill="#3A2E1E" /> {/* back wall */}
    <rect x={0} y={0} width={1000} height={3} fill="#2A1E12" /> {/* ceiling line */}
    {/* Wainscoting */}
    <rect x={0} y={40} width={1000} height={30} fill="#33271A" />
    <line x1={0} y1={40} x2={1000} y2={40} stroke="#4A3C2A" strokeWidth={1}/>
    <line x1={0} y1={70} x2={1000} y2={70} stroke="#4A3C2A" strokeWidth={1}/>

    {/* ── KITCHEN AREA (top left) ── */}
    <rect x={30} y={75} width={200} height={80} rx={3} fill="#3D3025" stroke="#4A3C2A" strokeWidth={1}/> {/* counter */}
    <rect x={40} y={80} width={50} height={30} rx={2} fill="#555" stroke="#666" strokeWidth={0.5}/> {/* stove */}
    {[55,65,75].map(x=><circle key={x} cx={x} cy={95} r={5} fill="#333" stroke="#444" strokeWidth={0.5}/>)} {/* burners */}
    <rect x={100} y={80} width={40} height={40} rx={2} fill="#D4D4D4" stroke="#AAA" strokeWidth={0.5}/> {/* sink */}
    <rect x={112} y={85} width={16} height={25} rx={4} fill="#BBB"/> {/* basin */}
    <circle cx={120} cy={82} r={2} fill="#888"/> {/* faucet */}
    <rect x={150} y={78} width={70} height={72} rx={3} fill="#E8E0D0" stroke="#CCC" strokeWidth={0.5}/> {/* fridge */}
    <rect x={152} y={80} width={66} height={35} rx={2} fill="#DDD"/> {/* fridge top */}
    <rect x={152} y={118} width={66} height={28} rx={2} fill="#DDD"/> {/* fridge bottom */}
    <circle cx={215} cy={98} r={2} fill="#888"/> {/* fridge handle */}
    <circle cx={215} cy={132} r={2} fill="#888"/>
    {/* Hanging pots */}
    {[50,70,90].map((x,i)=><g key={i}><line x1={x} y1={75} x2={x} y2={75-10-i*3} stroke="#666" strokeWidth={0.5}/><ellipse cx={x} cy={75-10-i*3} rx={6} ry={3} fill={['#8B4513','#CD853F','#A0522D'][i]} stroke="#555" strokeWidth={0.3}/></g>)}
    <text x={130} y={167} textAnchor="middle" fill="#5A4D3C" fontSize={9} fontFamily="serif">🍳 Kitchen</text>

    {/* ── LIVING ROOM AREA (top right) ── */}
    {/* Bookshelf */}
    <rect x={780} y={73} width={130} height={80} rx={2} fill="#4A3520" stroke="#5A4530" strokeWidth={1}/>
    {[0,1,2].map(r=><g key={r}>
      <rect x={784} y={77+r*25} width={122} height={22} fill="#3D2A15"/>
      {Array.from({length:8}).map((_,b)=>{
        const bx=786+b*15+Math.random()*2;
        const bh=14+Math.random()*6;
        return <rect key={b} x={bx} y={77+r*25+(22-bh)} width={10} height={bh} rx={1}
          fill={['#8B1A1A','#1A3A6B','#2E5A37','#6B4A1A','#4A1A5A','#1A5A4A','#8B6B1A','#3A1A1A'][b%8]}/>
      })}
    </g>)}
    {/* Painting on wall */}
    <rect x={630} y={8} width={80} height={55} rx={2} fill="#5A4530" stroke="#6B5A40" strokeWidth={2}/>
    <rect x={634} y={12} width={72} height={47} fill="#1A3050"/> {/* sky */}
    <rect x={634} y={40} width={72} height={19} fill="#2A5A2A"/> {/* grass */}
    <circle cx={680} cy={25} r={8} fill="#FFD700" opacity={0.6}/> {/* sun */}
    {/* Couch */}
    <rect x={820} y={170} width={100} height={50} rx={8} fill="#6B3A2A" stroke="#5A2A1A" strokeWidth={1}/>
    <rect x={825} y={175} width={40} height={40} rx={5} fill="#7B4A3A"/>
    <rect x={870} y={175} width={40} height={40} rx={5} fill="#7B4A3A"/>
    <rect x={820} y={165} width={15} height={55} rx={5} fill="#5A2A1A"/> {/* arm */}
    <rect x={905} y={165} width={15} height={55} rx={5} fill="#5A2A1A"/>
    {/* Throw pillow */}
    <rect x={835} y={178} width={18} height={14} rx={4} fill="#D4A017" transform="rotate(-5 844 185)"/>
    <rect x={880} y={178} width={18} height={14} rx={4} fill="#8B1A1A" transform="rotate(8 889 185)"/>
    {/* Side table */}
    <rect x={930} y={180} width={35} height={25} rx={2} fill="#4A3520"/>
    <rect x={940} y={172} width={15} height={8} rx={3} fill="#AACC44"/> {/* plant */}
    <ellipse cx={947} cy={168} rx={10} ry={6} fill="#3A7A2A"/>

    {/* ── DOOR (right wall) ── */}
    <rect x={940} y={280} width={45} height={80} rx={2} fill={doorOpen?'#1A1A3A':'#5A3D20'} stroke="#6B4E31" strokeWidth={2}/>
    <circle cx={948} cy={320} r={3} fill="#DAA520"/> {/* doorknob */}
    {doorOpen && <text x={962} y={325} textAnchor="middle" fill="#FFD70066" fontSize={20}>✨</text>}
    <text x={962} y={375} textAnchor="middle" fill="#5A4D3C" fontSize={8} fontFamily="serif">🚪 Door</text>

    {/* ── RUG under table ── */}
    <ellipse cx={500} cy={400} rx={290} ry={180} fill="#3A2515" stroke="#4A3525" strokeWidth={2}/>
    <ellipse cx={500} cy={400} rx={270} ry={165} fill="none" stroke="#4A3525" strokeWidth={1} strokeDasharray="8 4"/>
    <ellipse cx={500} cy={400} rx={250} ry={150} fill="#35200F"/>
    {/* Rug pattern */}
    {[0,1,2,3,4,5,6,7].map(i=>{const a=(i/8)*Math.PI*2;return <circle key={i} cx={500+Math.cos(a)*200} cy={400+Math.sin(a)*120} r={6} fill="#4A3020" stroke="#5A4030" strokeWidth={0.5}/>})}

    {/* ── TABLE ── */}
    <rect x={340} y={230} width={320} height={300} rx={10} fill="#6B4E31" stroke="#7B5E41" strokeWidth={2}/>
    {/* Tablecloth */}
    <rect x={348} y={236} width={304} height={288} rx={6} fill="#FAF0E0" opacity={0.9} stroke="#E8D8C0" strokeWidth={1}/>
    {/* Tablecloth embroidered border */}
    <rect x={355} y={243} width={290} height={274} rx={4} fill="none" stroke="#D4C4A4" strokeWidth={0.5} strokeDasharray="6 3"/>

    {/* ── TABLE ITEMS ── */}
    {/* Seder Plate — detailed */}
    <circle cx={500} cy={370} r={45} fill="#C8A870" stroke="#A88850" strokeWidth={2}/>
    <circle cx={500} cy={370} r={38} fill="none" stroke="#B89860" strokeWidth={1}/>
    <circle cx={500} cy={370} r={30} fill="none" stroke="#B89860" strokeWidth={0.5}/>
    {/* Seder plate items with labels */}
    {[
      {a:0,c:'#4A7A3A',n:'Karpas'},{a:1,c:'#8B4513',n:'Zeroa'},{a:2,c:'#F5DEB3',n:'Egg'},
      {a:3,c:'#8B6040',n:'Charoset'},{a:4,c:'#3A6A2A',n:'Maror'},{a:5,c:'#2A5A1A',n:'Chazeret'}
    ].map(({a,c,n},i)=>{
      const ang=(a/6)*Math.PI*2-Math.PI/2;
      const r=22;
      return <g key={i}>
        <circle cx={500+Math.cos(ang)*r} cy={370+Math.sin(ang)*r} r={6} fill={c} stroke="#00000022" strokeWidth={0.5}/>
        <text x={500+Math.cos(ang)*r} y={370+Math.sin(ang)*r+2} textAnchor="middle" fill="#00000066" fontSize={3.5} fontFamily="serif">{n}</text>
      </g>;
    })}

    {/* Candelabra */}
    <rect x={480} y={260} width={4} height={30} fill="#C0C0C0" rx={1}/>
    <rect x={496} y={260} width={4} height={30} fill="#C0C0C0" rx={1}/>
    <rect x={512} y={260} width={4} height={30} fill="#C0C0C0" rx={1}/>
    <rect x={478} y={288} width={40} height={4} rx={2} fill="#A0A0A0"/>
    {/* Candles */}
    {[482,498,514].map(x=><g key={x}>
      <rect x={x} y={248} width={4} height={14} fill="#FFF8DC" rx={1}/>
      <ellipse cx={x+2} cy={246} rx={3} ry={4} fill="#FFD700" opacity={0.9}/>
      <ellipse cx={x+2} cy={244} rx={5} ry={6} fill="#FFAA33" opacity={0.12}/>
    </g>)}

    {/* Matzah stack with cover */}
    <rect x={390} y={310} width={40} height={30} rx={3} fill="#D2B48C" stroke="#B8A07C" strokeWidth={0.5}/>
    <rect x={388} y={308} width={44} height={6} rx={2} fill="#F0E8D8" stroke="#DDD0C0" strokeWidth={0.3}/>
    <text x={410} y={352} textAnchor="middle" fill="#8B7355" fontSize={5} fontFamily="serif">Matzot</text>

    {/* Elijah's cup */}
    <rect x={545} y={295} width={12} height={20} rx={3} fill="#DAA520" stroke="#C89520" strokeWidth={1}/>
    <rect x={543} y={293} width={16} height={4} rx={2} fill="#DAA520"/>
    <rect x={547} y={315} width={8} height={3} rx={1} fill="#C89520"/>
    <text x={551} y={328} textAnchor="middle" fill="#D4A017" fontSize={4} fontFamily="serif">Elijah</text>

    {/* Salt water bowls */}
    {[420,560].map(x=><g key={x}>
      <ellipse cx={x} cy={420} rx={10} ry={6} fill="#E8E0D0" stroke="#CCC" strokeWidth={0.5}/>
      <ellipse cx={x} cy={419} rx={8} ry={4} fill="#B8D4E8" opacity={0.6}/>
    </g>)}

    {/* Individual place settings */}
    {CHARS.map(c=>{
      const s=c.seat;
      const dx=s.x<500?25:-25;
      const dy=s.y<400?20:s.y>450?-15:0;
      const px=s.x+dx, py=s.y+dy;
      return <g key={c.id+'ps'}>
        {/* Plate */}
        <circle cx={px} cy={py} r={14} fill="#FAF8F0" stroke="#DDD" strokeWidth={0.5}/>
        <circle cx={px} cy={py} r={11} fill="none" stroke="#E8E0D0" strokeWidth={0.3}/>
        {/* Fork left, knife right */}
        <line x1={px-17} y1={py-8} x2={px-17} y2={py+10} stroke="#C0C0C0" strokeWidth={1}/>
        <line x1={px+17} y1={py-8} x2={px+17} y2={py+10} stroke="#C0C0C0" strokeWidth={1.2}/>
        {/* Napkin */}
        <rect x={px-20} y={py-3} width={5} height={8} rx={1} fill="#FAF0E6" stroke="#E0D0C0" strokeWidth={0.3} transform={`rotate(-10 ${px-18} ${py})`}/>
        {/* Wine glass */}
        <line x1={px+20} y1={py-3} x2={px+20} y2={py-10} stroke="#C8C8C8" strokeWidth={0.5}/>
        <ellipse cx={px+20} cy={py-11} rx={4} ry={5} fill="none" stroke="#C8C8C8" strokeWidth={0.5}/>
        <ellipse cx={px+20} cy={py-9} rx={3} ry={3} fill="#722F37" opacity={0.5}/>
        <ellipse cx={px+20} cy={py-2} rx={3} ry={1} fill="#C8C8C8" opacity={0.5}/>
        {/* Haggadah */}
        <rect x={px-8} y={py+14} width={16} height={11} rx={1}
          fill={['#8B1A1A','#1A1A8B','#2E8B57','#8B4513','#4A1A6B','#1A6B4A','#8B6B1A','#3A1A4A','#5A2A1A','#1A4A3A','#6B4A2A','#2A3A6B'][CHARS.indexOf(c)%12]}
          transform={`rotate(${(CHARS.indexOf(c)-6)*2} ${px} ${py+19})`} opacity={0.8}/>
      </g>;
    })}

    {/* Chairs */}
    {CHARS.map(c=>{
      const s=c.seat;
      const angle = Math.atan2(400-s.y, 500-s.x);
      const cx=s.x-Math.cos(angle)*5, cy=s.y-Math.sin(angle)*5;
      return <g key={c.id+'chair'}>
        <rect x={cx-14} y={cy-10} width={28} height={22} rx={4} fill="#5A3D20" stroke="#6B4E31" strokeWidth={1}/>
        <rect x={cx-12} y={cy-8} width={24} height={18} rx={3} fill="#8B1A1A" opacity={0.6}/> {/* cushion */}
        {/* Chair back */}
        <rect x={cx-14} y={cy-18} width={28} height={10} rx={3} fill="#5A3D20" stroke="#6B4E31" strokeWidth={0.5}/>
      </g>;
    })}

    {/* ── WARM LIGHTING EFFECTS ── */}
    <radialGradient id="candle1" cx="498" cy="250" r="120" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#FFAA33" stopOpacity="0.08"/><stop offset="100%" stopColor="#FFAA33" stopOpacity="0"/>
    </radialGradient>
    <rect x={0} y={0} width={1000} height={700} fill="url(#candle1)"/>
    <radialGradient id="overhead" cx="500" cy="350" r="300" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#FFE8CC" stopOpacity="0.06"/><stop offset="100%" stopColor="#000" stopOpacity="0"/>
    </radialGradient>
    <rect x={0} y={0} width={1000} height={700} fill="url(#overhead)"/>
  </g>;
}

/* ════════════════════════════════════════════════════════════
   CHARACTER SPRITE — detailed
   ════════════════════════════════════════════════════════════ */
function Char({ c, x, y, talking, standing, t }) {
  const sc = c.age==='child'?0.65:c.age==='teen'?0.8:1;
  const bob = talking ? Math.sin(t*6)*2 : 0;
  const hBob = talking ? Math.sin(t*4)*2 : 0;
  const armL = talking ? Math.sin(t*3)*15 : 0;
  const armR = talking ? -Math.sin(t*3.5)*12 : 0;
  const yOff = standing ? -6 : 0;
  const mouthOpen = talking ? Math.abs(Math.sin(t*8))*3 : 0;

  return <g transform={`translate(${x},${y+yOff+bob}) scale(${sc})`}>
    <ellipse cx={0} cy={30} rx={16} ry={5} fill="rgba(0,0,0,0.25)"/>

    {/* Body */}
    <ellipse cx={0} cy={6} rx={12} ry={16} fill={c.color} stroke="#00000033" strokeWidth={0.8}/>
    {/* Collar detail */}
    <path d={`M-5,-7 Q0,-4 5,-7`} fill="none" stroke={c.gender==='M'?"#FFFFFF33":"#FFFFFF22"} strokeWidth={1}/>

    {/* Arms */}
    <g transform={`rotate(${armL} -12 0)`}>
      <line x1={-12} y1={0} x2={-20} y2={14} stroke={c.color} strokeWidth={6} strokeLinecap="round"/>
      <circle cx={-20} cy={15} r={3.5} fill={c.skin}/>
    </g>
    <g transform={`rotate(${armR} 12 0)`}>
      <line x1={12} y1={0} x2={20} y2={14} stroke={c.color} strokeWidth={6} strokeLinecap="round"/>
      <circle cx={20} cy={15} r={3.5} fill={c.skin}/>
    </g>

    {/* Neck */}
    <rect x={-3.5} y={-11} width={7} height={5} fill={c.skin} rx={2}/>

    {/* Head */}
    <g transform={`translate(0,${hBob})`}>
      <ellipse cx={0} cy={-20} rx={13} ry={14} fill={c.skin}/>

      {/* Hair */}
      {c.gender==='F' && c.age!=='elder' ? <>
        <ellipse cx={0} cy={-28} rx={14} ry={9} fill={c.hair}/>
        <ellipse cx={-11} cy={-16} rx={4.5} ry={12} fill={c.hair}/>
        <ellipse cx={11} cy={-16} rx={4.5} ry={12} fill={c.hair}/>
        <ellipse cx={0} cy={-14} rx={13} ry={8} fill={c.hair} opacity={0.5}/>
      </> : c.age==='elder' && c.gender==='F' ? <>
        <ellipse cx={0} cy={-28} rx={14} ry={8} fill={c.hair}/>
        {Array.from({length:8}).map((_,i)=>{const a=(i/8)*Math.PI*2;return <circle key={i} cx={Math.cos(a)*10} cy={-26+Math.sin(a)*5} r={3} fill={c.hair}/>})}
      </> : c.hair!=='#AAA' || c.age!=='elder' ? <>
        <ellipse cx={0} cy={-29} rx={12} ry={6} fill={c.hair}/>
      </> : <>
        <ellipse cx={0} cy={-30} rx={10} ry={4} fill={c.hair} opacity={0.5}/>
      </>}

      {/* Kippah */}
      {c.kippah && <ellipse cx={1} cy={-32} rx={7} ry={3.5} fill="#1A1A4A"/>}

      {/* Ears */}
      <ellipse cx={-12.5} cy={-19} rx={2.5} ry={4} fill={c.skin} stroke="#00000011" strokeWidth={0.3}/>
      <ellipse cx={12.5} cy={-19} rx={2.5} ry={4} fill={c.skin} stroke="#00000011" strokeWidth={0.3}/>

      {/* Eyes - white + iris + pupil + highlight */}
      {[-5,5].map(ex=><g key={ex}>
        <ellipse cx={ex} cy={-21} rx={3.2} ry={3.5} fill="white" stroke="#00000011" strokeWidth={0.3}/>
        <circle cx={ex+(talking?Math.sin(t)*0.5:0)} cy={-21} r={2} fill={c.age==='child'?'#4A3520':'#2A1A0A'}/>
        <circle cx={ex+(talking?Math.sin(t)*0.5:0)} cy={-21} r={1} fill="#111"/>
        <circle cx={ex+0.8} cy={-22} r={0.6} fill="white" opacity={0.8}/>
      </g>)}

      {/* Eyebrows */}
      <line x1={-7.5} y1={-25} x2={-2.5} y2={-25.5} stroke={c.hair} strokeWidth={1} strokeLinecap="round"/>
      <line x1={2.5} y1={-25.5} x2={7.5} y2={-25} stroke={c.hair} strokeWidth={1} strokeLinecap="round"/>

      {/* Nose */}
      <ellipse cx={0} cy={-16} rx={2} ry={1.5} fill={c.skin} stroke="#00000012" strokeWidth={0.3}/>

      {/* Cheeks (blush) */}
      {c.age==='child' && <>
        <circle cx={-7} cy={-15} r={3} fill="#FF8888" opacity={0.15}/>
        <circle cx={7} cy={-15} r={3} fill="#FF8888" opacity={0.15}/>
      </>}

      {/* Mouth */}
      {mouthOpen > 0.5 ?
        <ellipse cx={0} cy={-12} rx={3} ry={mouthOpen} fill="#884444"/> :
        <path d="M-3.5,-12 Q0,-10 3.5,-12" stroke="#884444" strokeWidth={0.8} fill="none"/>
      }

      {/* Beard */}
      {c.beard && <>
        <ellipse cx={0} cy={-8} rx={7} ry={6} fill={c.hair} opacity={0.8}/>
        <ellipse cx={0} cy={-12} rx={5} ry={2} fill={c.hair} opacity={0.5}/>
      </>}

      {/* Glasses */}
      {c.age==='elder' && c.gender==='M' && <>
        <circle cx={-5} cy={-21} r={4.5} fill="none" stroke="#555" strokeWidth={0.7}/>
        <circle cx={5} cy={-21} r={4.5} fill="none" stroke="#555" strokeWidth={0.7}/>
        <line x1={-0.5} y1={-21} x2={0.5} y2={-21} stroke="#555" strokeWidth={0.7}/>
        <line x1={-9.5} y1={-21} x2={-13} y2={-20} stroke="#555" strokeWidth={0.5}/>
        <line x1={9.5} y1={-21} x2={13} y2={-20} stroke="#555" strokeWidth={0.5}/>
      </>}
    </g>

    {/* Name */}
    <text x={0} y={40} textAnchor="middle" fill="#C9B89A" fontSize={9} fontFamily="'Crimson Pro',serif" fontWeight={600}>{c.name}</text>
    <text x={0} y={49} textAnchor="middle" fill="#8B7355" fontSize={7} fontFamily="'Crimson Pro',serif">{c.role}</text>
  </g>;
}

/* ════════════════════════════════════════════════════════════
   SPEECH BUBBLE
   ════════════════════════════════════════════════════════════ */
function Bubble({ x, y, text, he }) {
  if (!text && !he) return null;
  const bx = Math.max(120, Math.min(880, x));
  return <foreignObject x={bx-110} y={Math.max(10, y-70)} width={220} height={90} style={{overflow:'visible'}}>
    <div style={{background:'rgba(15,12,8,0.94)',border:'1px solid #D4A01755',borderRadius:12,padding:'7px 11px',color:'#F5F0E0',fontSize:12,lineHeight:1.4,fontFamily:"'Crimson Pro',serif",backdropFilter:'blur(6px)',boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
      {he && <div style={{direction:'rtl',textAlign:'right',marginBottom:text?4:0,fontSize:13}}>{he}</div>}
      {text && <div style={{fontStyle:he?'italic':'normal',color:he?'#B8A88A':'#F5F0E0',fontSize:he?11:12}}>{text}</div>}
    </div>
  </foreignObject>;
}

/* ════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════ */
export default function Seder() {
  const [go,setGo]=useState(false);
  const [svcStatus,setSvcStatus]=useState({hasEL:false,hasAI:false});
  const [pos,setPos]=useState(()=>Object.fromEntries(CHARS.map(c=>[c.id,{...c.seat}])));
  const [spk,setSpk]=useState(null);
  const [standing,setStanding]=useState(new Set());
  const [bub,setBub]=useState(null);
  const [phase,setPhase]=useState('');
  const [sub,setSub]=useState({he:'',en:''});
  const [bi,setBi]=useState(0);
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [done,setDone]=useState(false);
  const [shH,setShH]=useState(true);
  const [shE,setShE]=useState(true);
  const [audOn,setAudOn]=useState(true);
  const [doorOpen,setDoorOpen]=useState(false);
  const [t,setT]=useState(0);
  const engRef=useRef<Engine|null>(null);
  const pRef=useRef(false);
  const sRef=useRef(1);
  useEffect(()=>{pRef.current=paused;},[paused]);
  useEffect(()=>{sRef.current=speed;},[speed]);
  useEffect(()=>{if(!go)return;let r:number;const f=()=>{setT(v=>v+0.016);r=requestAnimationFrame(f);};r=requestAnimationFrame(f);return()=>cancelAnimationFrame(r);},[go]);

  // Check services on mount
  useEffect(()=>{
    const eng=new Engine();
    eng.init().then(s=>setSvcStatus(s));
  },[]);

  const wt=(ms:number)=>new Promise<void>(r=>{const ck=()=>{if(!pRef.current){ms-=16*sRef.current;if(ms<=0)r();else setTimeout(ck,16);}else setTimeout(ck,100);};ck();});
  const mv=(w:string,to:{x:number,y:number},d:number)=>new Promise<void>(r=>{const st={...(pos[w]||CM[w]?.seat||{x:500,y:400})};let step=0;const n=Math.max(1,Math.floor(d/30));const go=()=>{step++;const p=Math.min(1,step/n);const e=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;setPos(prev=>({...prev,[w]:{x:st.x+(to.x-st.x)*e,y:st.y+(to.y-st.y)*e}}));if(step<n)setTimeout(go,30);else r();};go();});

  const run=async()=>{
    const eng=new Engine();
    await eng.init();
    eng.audioEnabled=audOn;
    engRef.current=eng;

    for(let i=0;i<SCRIPT.length;i++){
      while(pRef.current)await new Promise(r=>setTimeout(r,200));
      const b=SCRIPT[i] as any;setBi(i);

      if(b.phase){setPhase(b.phase);setBub(null);setSpk(null);setSub({he:'',en:''});await wt(3000);continue;}
      if(b.act==='end'){setDone(true);return;}
      if(b.act==='stand'){setStanding(s=>{const n=new Set(s);(b.who==='all'?CHARS.map(c=>c.id):[b.who]).forEach((id:string)=>n.add(id));return n;});await wt(500);continue;}
      if(b.act==='sit'){setStanding(s=>{const n=new Set(s);if(b.who==='all')n.clear();else n.delete(b.who);return n;});await wt(500);continue;}
      if(b.act==='move'){await mv(b.who,b.to,b.dur||1000);continue;}
      if(b.act==='drink'||b.act==='eat'){setSub({he:'',en:b.act==='drink'?'Everyone drinks! 🍷':'Everyone eats!'});await wt(3000);continue;}
      if(b.act==='door'){setDoorOpen(true);setSub({he:'',en:'The door opens... the candles flicker... ✨'});await wt(5000);setDoorOpen(false);continue;}

      // ── AGENTIC REACTION — AI generates dialogue from personality .md files ──
      if(b.react){
        const reactions=await eng.generateReactions(b.ctx,b.chars,phase,b.max||2);
        for(const rx of reactions){
          if(!rx.en&&!rx.he)continue;
          const c=CM[rx.speaker]||CM.leader;
          const p=pos[rx.speaker]||c.seat;
          setSpk(rx.speaker);
          setSub({he:rx.he||'',en:rx.en||''});
          setBub({x:p.x,y:p.y,text:rx.en,he:rx.he});
          const txt=rx.en||rx.he;
          await Promise.race([eng.speak(txt,rx.speaker),wt(Math.max(txt.length*75,2500))]);
          setSpk(null);setBub(null);await wt(400);
        }
        continue;
      }

      // ── FIXED LITURGY / SPEECH ──
      if(b.say){
        const c=CM[b.say]||CM.leader;const p=pos[b.say]||c.seat;
        setSpk(b.say);setSub({he:b.he||'',en:b.en||''});
        setBub({x:p.x,y:p.y,text:b.en,he:b.he});
        const txt=b.en||b.he||'';
        await Promise.race([eng.speak(txt,b.say==='all'?'leader':b.say),wt(b.dur||Math.max(txt.length*75,2500))]);
        setSpk(null);setBub(null);await wt(250);
      }
    }
  };

  const start=()=>{setGo(true);setTimeout(run,500);};
  const sc=spk?CM[spk]:null;

  if(!go)return(
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 40% 30%,#2A1F14,#0C0906 70%)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Crimson Pro',Georgia,serif",padding:20}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;1,300&display=swap');@keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}@keyframes flicker{0%,100%{opacity:1}40%{opacity:0.8}}`}</style>
      <div style={{textAlign:'center',animation:'fadeIn 2s',maxWidth:480}}>
        <div style={{fontSize:48,marginBottom:20,display:'flex',justifyContent:'center',gap:32}}><span style={{animation:'flicker 4s infinite'}}>🕯️</span><span style={{animation:'flicker 4s infinite 1s'}}>🕯️</span></div>
        <h1 style={{color:'#FAF0E6',fontSize:44,fontWeight:200,margin:0}}>The Agentic Seder</h1>
        <div style={{color:'#8B7355',fontSize:32,margin:'4px 0 16px'}}>הַסֵּדֶר</div>
        <p style={{color:'#8B7355',fontSize:12,lineHeight:1.6,maxWidth:360,margin:'0 auto 16px'}}>12 characters around a dinner table. A kitchen, a living room, a bookshelf. They talk, argue, sing, eat, search for the Afikoman, and open the door for Elijah. Every viewing is different — AI generates fresh dialogue each time.</p>
        <div style={{color:'#5A4D3C',fontSize:10,marginBottom:16,lineHeight:1.6}}>
          {svcStatus.hasAI ? '🟢 AI Dialogue (Claude)' : '⚪ Fallback dialogue'} · {svcStatus.hasEL ? '🟢 Natural voices (ElevenLabs)' : '⚪ Browser voices'}
        </div>
        <br/>
        <button onClick={start} style={{background:'linear-gradient(135deg,#8B1A1A,#4A0A0A)',color:'#FAF0E6',border:'none',borderRadius:12,padding:'15px 46px',fontSize:18,cursor:'pointer',fontFamily:"'Crimson Pro',serif",boxShadow:'0 4px 30px rgba(139,26,26,0.3)'}}>Light the Candles</button>
      </div>
    </div>
  );

  return(
    <div style={{width:'100vw',height:'100vh',background:'#1A1410',overflow:'hidden',fontFamily:"'Crimson Pro',Georgia,serif",display:'flex',flexDirection:'column'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;1,300&display=swap');`}</style>

      {phase&&<div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',background:'rgba(12,9,5,0.92)',border:'1px solid #D4A01744',borderRadius:10,padding:'5px 18px',zIndex:20}}><div style={{color:'#D4A017',fontSize:13,fontWeight:600}}>{phase}</div></div>}
      {sc&&<div style={{position:'absolute',top:8,left:8,background:'rgba(12,9,5,0.9)',borderRadius:8,padding:'4px 10px',zIndex:20}}><div style={{color:'#7EC87E',fontSize:8,letterSpacing:1.5}}>SPEAKING</div><div style={{color:'#E8D5B7',fontSize:12,fontWeight:600}}>{sc.name}</div><div style={{color:'#8B7355',fontSize:8}}>{sc.role}</div></div>}

      <svg viewBox="0 0 1000 700" style={{flex:1,width:'100%'}}>
        <Room doorOpen={doorOpen}/>
        {CHARS.map(c=>{const p=pos[c.id]||c.seat;return <Char key={c.id} c={c} x={p.x} y={p.y} talking={spk===c.id||spk==='all'} standing={standing.has(c.id)} t={t}/>;})}
        {bub&&<Bubble x={bub.x} y={bub.y} text={bub.text} he={bub.he}/>}
      </svg>

      {(sub.he||sub.en)&&<div style={{position:'absolute',bottom:44,left:'50%',transform:'translateX(-50%)',width:'88%',maxWidth:620,background:'rgba(8,6,3,0.93)',borderRadius:10,padding:'8px 16px',border:'1px solid #D4A01722',zIndex:10}}>
        {shH&&sub.he&&<p style={{color:'#FAF0E6',fontSize:14,lineHeight:1.6,margin:0,direction:'rtl',textAlign:'right'}}>{sub.he}</p>}
        {shE&&sub.en&&<p style={{color:shH&&sub.he?'#B8A88A':'#FAF0E6',fontSize:shH&&sub.he?11:13,margin:shH&&sub.he?'3px 0 0':0,fontStyle:shH&&sub.he?'italic':'normal'}}>{sub.en}</p>}
      </div>}

      <div style={{padding:'5px 10px',background:'rgba(8,6,3,0.95)',borderTop:'1px solid #1A1410',display:'flex',justifyContent:'space-between',alignItems:'center',gap:5,flexShrink:0}}>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <button onClick={()=>setPaused(p=>!p)} style={bs}>{paused?'▶':'⏸'}</button>
          <select value={speed} onChange={e=>setSpeed(+e.target.value)} style={{...bs,fontSize:9,padding:'2px 4px'}}><option value={0.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option><option value={3}>3×</option></select>
        </div>
        <div style={{flex:1,margin:'0 8px'}}><div style={{height:3,background:'#1A1410',borderRadius:2}}><div style={{height:3,borderRadius:2,background:'#D4A017',width:`${SCRIPT.length?(bi/SCRIPT.length)*100:0}%`,transition:'width 0.3s'}}/></div><div style={{color:'#5A4D3C',fontSize:7,textAlign:'center',marginTop:1}}>{bi+1}/{SCRIPT.length}</div></div>
        <div style={{display:'flex',gap:3}}>
          <button onClick={()=>setShH(h=>!h)} style={{...bs,background:shH?'#3A2A10':'#1A1410',color:shH?'#D4A017':'#5A4D3C',fontSize:9}}>עב</button>
          <button onClick={()=>setShE(e=>!e)} style={{...bs,background:shE?'#3A2A10':'#1A1410',color:shE?'#D4A017':'#5A4D3C',fontSize:9}}>EN</button>
          <button onClick={()=>{setAudOn(a=>!a);aRef.current?.stop();}} style={{...bs,color:audOn?'#D4A017':'#5A4D3C'}}>{audOn?'🔊':'🔇'}</button>
        </div>
      </div>

      {done&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
        <div style={{textAlign:'center'}}><div style={{fontSize:56,marginBottom:12}}>🕯️✡️🕯️</div><h2 style={{color:'#D4A017',fontSize:26,fontWeight:200}}>לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם</h2><p style={{color:'#FAF0E6',fontSize:15}}>Next Year in Jerusalem</p><p style={{color:'#8B7355',fontSize:12,margin:'4px 0 16px'}}>Chag Pesach Sameach!</p>
        <button onClick={()=>window.location.reload()} style={{background:'linear-gradient(135deg,#8B1A1A,#4A0A0A)',color:'#FAF0E6',border:'none',borderRadius:10,padding:'10px 28px',fontSize:14,cursor:'pointer'}}>Watch Again</button></div>
      </div>}
    </div>
  );
}

const bs={background:'#2A2118',border:'1px solid #3D3428',color:'#8B7355',borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:11,fontFamily:"'Crimson Pro',serif"};
