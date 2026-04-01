'use client';
import { useState, useEffect, useRef } from 'react';
import { Engine, unlockWebAudio } from '@/engine/engine';

const CHARS = [
  { id:'leader', name:'Rabbi David', role:'Seder Leader', seat:{x:500,y:235}, color:'#F5F0DC', hair:'#AAA', skin:'#C9A87C', gender:'M', age:'elder', kippah:true, beard:true },
  { id:'mother', name:'Shira', role:'Mom', seat:{x:280,y:290}, color:'#7B3F7B', hair:'#4A2F1C', skin:'#D2A679', gender:'F', age:'adult' },
  { id:'father', name:'Avi', role:'Dad', seat:{x:720,y:290}, color:'#2F4F4F', hair:'#3B2F1C', skin:'#BE8C63', gender:'M', age:'adult', kippah:true },
  { id:'savta', name:'Savta Esther', role:'Grandma', seat:{x:220,y:380}, color:'#8B2040', hair:'#C0C0C0', skin:'#C9A87C', gender:'F', age:'elder' },
  { id:'saba', name:'Saba Yosef', role:'Grandpa', seat:{x:780,y:380}, color:'#2C2C54', hair:'#AAA', skin:'#C49B6C', gender:'M', age:'elder', kippah:true, beard:true },
  { id:'child_young', name:'Noa', role:'8 yrs', seat:{x:260,y:470}, color:'#E85D9A', hair:'#5C3317', skin:'#DEB887', gender:'F', age:'child' },
  { id:'child_wise', name:'Yael', role:'16 yrs', seat:{x:740,y:470}, color:'#2E8B57', hair:'#3B2F1C', skin:'#D2A679', gender:'F', age:'teen' },
  { id:'child_wicked', name:'Dani', role:'15 yrs', seat:{x:220,y:510}, color:'#222', hair:'#2B1F14', skin:'#BE8C63', gender:'M', age:'teen' },
  { id:'child_simple', name:'Eli', role:'6 yrs', seat:{x:780,y:510}, color:'#3A6BC5', hair:'#7A4E2D', skin:'#DEB887', gender:'M', age:'child', kippah:true },
  { id:'uncle', name:'Dod Moshe', role:'Uncle', seat:{x:240,y:440}, color:'#4A6B2F', hair:'#2B1F14', skin:'#C49B6C', gender:'M', age:'adult', kippah:true },
  { id:'aunt', name:'Doda Leah', role:'Aunt', seat:{x:760,y:440}, color:'#B8860B', hair:'#8B4513', skin:'#BE8C63', gender:'F', age:'young' },
  { id:'guest', name:'Ben', role:'Guest', seat:{x:500,y:570}, color:'#607080', hair:'#463E2E', skin:'#D2A679', gender:'M', age:'young', kippah:true },
];
const CM: Record<string, typeof CHARS[0]> = Object.fromEntries(CHARS.map(c => [c.id, c]));

// COMPLETE SEDER SCRIPT — liturgy fixed, ALL reactions agentic, full Seder choreography
const SCRIPT: any[] = [
  // PRE-SEDER
  {act:'move',who:'mother',to:{x:160,y:100},dur:1500},{act:'move',who:'mother',to:{x:280,y:290},dur:1200},
  {react:true, ctx:'Everyone arriving. Kids restless. Guest adjusting borrowed kippah. Grandmother inspecting table. Someone needs to light candles.', chars:['mother','child_young','child_wicked','guest','saba','savta'], max:4},
  // Candle lighting
  {say:'mother', en:"Blessed are You, Lord our God, who commanded us to kindle the festival lights.", he:"בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ לְהַדְלִיק נֵר שֶׁל יוֹם טוֹב.", dur:8000},
  {react:true, ctx:'Mother just lit candles and covered her eyes for the blessing. Room feels warmer. Beautiful sacred moment.', chars:['savta','guest','child_simple'], max:2},

  // KADESH
  {phase:'קַדֵּשׁ · Kadesh — Sanctification'},
  {react:true, ctx:'Time to pour the first cup. At the Seder you do NOT pour your own wine — someone pours for you because tonight we are royalty.', chars:['leader','father','uncle'], max:1},
  {act:'stand',who:'leader'},
  {say:'leader', en:"Blessed are You, Lord our God, King of the universe, who creates the fruit of the vine.", he:"בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.", dur:7000},
  {say:'leader', en:"Blessed are You, Lord our God, who has chosen us from all peoples, exalted us, and sanctified us with His commandments.", he:"בָּרוּךְ אַתָּה ה׳, אֲשֶׁר בָּחַר בָּנוּ מִכָּל עָם, וְרוֹמְמָנוּ מִכָּל לָשׁוֹן, וְקִדְּשָׁנוּ בְּמִצְוֹתָיו.", dur:10000},
  {say:'leader', en:"This Festival of Matzot, the season of our freedom, in remembrance of the Exodus.", he:"אֶת יוֹם חַג הַמַּצּוֹת הַזֶּה, זְמַן חֵרוּתֵנוּ, זֵכֶר לִיצִיאַת מִצְרָיִם.", dur:7000},
  {say:'leader', en:"Blessed are You, Lord, who has kept us alive and brought us to this season.", he:"בָּרוּךְ אַתָּה ה׳, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.", dur:6000},
  {act:'drink'},{act:'sit',who:'leader'},
  {react:true, ctx:'Everyone drank first cup LEANING LEFT as free people. Wine is strong. Someone should remind guest about leaning.', chars:['uncle','child_wicked','savta','guest','aunt'], max:2},

  // URCHATZ
  {phase:'וּרְחַץ · Urchatz — Washing'},
  {say:'leader', en:"We wash our hands — without a blessing.", he:"נוטלים ידיים ללא ברכה.", dur:3500},
  {react:true, ctx:'Leader washed WITHOUT a blessing. Intentionally strange — the Seder is engineered to provoke questions from children.', chars:['guest','child_simple','child_wise','child_wicked'], max:2},

  // KARPAS
  {phase:'כַּרְפַּס · Karpas — Green Vegetable'},
  {react:true, ctx:'Passing the parsley bowl and salt water around the table. Everyone takes a piece.', chars:['mother','father'], max:1},
  {say:'leader', en:"Blessed are You, Lord our God, who creates the fruit of the earth.", he:"בָּרוּךְ אַתָּה ה׳, בּוֹרֵא פְּרִי הָאֲדָמָה.", dur:6000},
  {act:'eat'},
  {react:true, ctx:'Everyone ate parsley dipped in salt water. Very salty. Salt water = tears of slaves. Green = spring and hope. The whole story in one bite.', chars:['child_young','guest','mother','child_simple'], max:2},

  // YACHATZ
  {phase:'יַחַץ · Yachatz — Breaking the Matzah'},
  {act:'stand',who:'leader'},
  {react:true, ctx:'Leader breaking the middle matzah. Larger piece becomes the Afikoman — to be hidden! Children should watch carefully!', chars:['leader','child_young','child_simple'], max:1},
  {say:'leader', en:"We lift the seder plate and declare: This is the bread of affliction. All who are hungry — come and eat. All who need — come and celebrate Passover.", he:"הָא לַחְמָא עַנְיָא דִי אֲכָלוּ אַבְהָתָנָא. כָּל דִכְפִין יֵיתֵי וְיֵכוֹל, כָּל דִצְרִיךְ יֵיתֵי וְיִפְסַח.", dur:12000},
  {say:'leader', en:"Now we are here — next year in Israel. Now slaves — next year free.", he:"הָשַׁתָּא הָכָא, לְשָׁנָה הַבָּאָה בְּאַרְעָא דְיִשְׂרָאֵל. הָשַׁתָּא עַבְדֵי, לְשָׁנָה הַבָּאָה בְּנֵי חוֹרִין.", dur:8000},
  {act:'sit',who:'leader'},
  {act:'move',who:'father',to:{x:850,y:160},dur:1000},{act:'move',who:'father',to:{x:720,y:290},dur:1000},
  {react:true, ctx:'Father just snuck away to hide the Afikoman in the living room. Kids trying to watch. The Afikoman must be found later — it is the last food of the night.', chars:['child_young','father','child_simple','child_wicked'], max:2},

  // MAGGID
  {phase:'מַגִּיד · Maggid — The Telling'},
  {melody:'Ma Nishtana'},
  {react:true, ctx:'Second cup poured (by others). Time for Ma Nishtana. Everyone looks at Noa. She practiced for weeks.', chars:['mother','father','uncle'], max:1},
  {act:'stand',who:'child_young'},
  {say:'child_young', en:"Why is this night different from all other nights?", he:"מַה נִּשְׁתַּנָּה הַלַּיְלָה הַזֶּה מִכָּל הַלֵּילוֹת?", dur:6000},
  {say:'child_young', en:"On all other nights we eat bread or matzah — tonight only matzah?", he:"שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין חָמֵץ וּמַצָּה, הַלַּיְלָה הַזֶּה כֻּלּוֹ מַצָּה.", dur:7000},
  {say:'child_young', en:"On all other nights we eat all vegetables — tonight bitter herbs?", he:"שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין שְׁאָר יְרָקוֹת, הַלַּיְלָה הַזֶּה מָרוֹר.", dur:7000},
  {say:'child_young', en:"On all other nights we don't dip even once — tonight we dip twice?", he:"שֶׁבְּכָל הַלֵּילוֹת אֵין אָנוּ מַטְבִּילִין אֲפִילוּ פַּעַם אֶחָת, הַלַּיְלָה הַזֶּה שְׁתֵּי פְעָמִים.", dur:7000},
  {say:'child_young', en:"On all other nights we eat sitting or reclining — tonight we all recline?", he:"שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין בֵּין יוֹשְׁבִין וּבֵין מְסֻבִּין, הַלַּיְלָה הַזֶּה כֻּלָּנוּ מְסֻבִּין.", dur:7000},
  {act:'sit',who:'child_young'},
  {react:true, ctx:'Noa finished all four questions beautifully. She practiced for weeks. Whole table beaming. Grandmother crying. Even the teen is impressed.', chars:['savta','saba','guest','mother','child_wicked'], max:3},

  // Avadim Hayinu
  {say:'leader', en:"We were slaves to Pharaoh in Egypt, and the Lord brought us out with a strong hand. Had He not — we and our children would still be enslaved.", he:"עֲבָדִים הָיִינוּ לְפַרְעֹה בְּמִצְרָיִם, וַיּוֹצִיאֵנוּ ה׳ אֱלֹהֵינוּ מִשָּׁם בְּיָד חֲזָקָה וּבִזְרוֹעַ נְטוּיָה.", dur:12000},
  {react:true, ctx:'"We were slaves." Every generation must see itself as having personally left Egypt. Grandmother thinking of persecution in her lifetime.', chars:['child_wicked','savta','father','guest'], max:2},

  // Four Children
  {say:'leader', en:"The Torah speaks of four children: wise, rebellious, simple, and one who cannot ask.", he:"כְּנֶגֶד אַרְבָּעָה בָנִים דִּבְּרָה תוֹרָה.", dur:7000},
  {act:'stand',who:'child_wise'},
  {say:'child_wise', en:"The Wise Child asks: What are the laws God has commanded?", he:"חָכָם מָה הוּא אוֹמֵר? מָה הָעֵדוֹת וְהַחֻקִּים?", dur:5000},
  {say:'leader', en:"Teach the wise child all the laws of Passover.", he:"אַף אַתָּה אֱמוֹר לוֹ כְּהִלְכוֹת הַפֶּסַח.", dur:4000},
  {act:'sit',who:'child_wise'},
  {act:'stand',who:'child_wicked'},
  {say:'child_wicked', en:"The Rebellious Child says: What does this mean to YOU?", he:"רָשָׁע מָה הוּא אוֹמֵר? מָה הָעֲבוֹדָה הַזֹּאת לָכֶם?", dur:5000},
  {say:'leader', en:"For ME — not for you. Had you been there, you would not have been redeemed.", he:"בַּעֲבוּר זֶה עָשָׂה ה׳ לִי — לִי וְלֹא לוֹ.", dur:5000},
  {react:true, ctx:'The rebellious child was told by a 3000-year-old text he would not have been redeemed. But he IS at the table — that matters. The Seder has room for questions.', chars:['child_wicked','aunt','child_wise'], max:2},
  {act:'sit',who:'child_wicked'},
  {say:'child_simple', en:"What is this?", he:"תָּם מָה הוּא אוֹמֵר? מַה זֹּאת?", dur:3000},
  {say:'leader', en:"With a strong hand God brought us out. And for the child who cannot ask — you must begin for them.", he:"בְּחֹזֶק יָד הוֹצִיאָנוּ ה׳ מִמִּצְרַיִם. וְשֶׁאֵינוֹ יוֹדֵעַ לִשְׁאוֹל — אַתְּ פְּתַח לוֹ.", dur:6000},

  // V'hi She'amda
  {say:'leader', en:"In every generation they rise to destroy us — and the Holy One saves us from their hand.", he:"וְהִיא שֶׁעָמְדָה. שֶׁבְּכָל דּוֹר וָדוֹר עוֹמְדִים עָלֵינוּ לְכַלּוֹתֵנוּ, וְהַקָּדוֹשׁ בָּרוּךְ הוּא מַצִּילֵנוּ מִיָּדָם.", dur:13000},
  {react:true, ctx:'V\'hi She\'amda — "In every generation they rise to destroy us." Most emotional moment. Grandmother remembers the Shoah. Grandfather the wars. Even the teen feels it.', chars:['savta','guest','saba','child_wicked'], max:2},

  // Rabban Gamliel
  {say:'leader', en:"Rabban Gamliel said: Whoever does not explain these three things has not fulfilled their obligation.", he:"רַבָּן גַּמְלִיאֵל הָיָה אוֹמֵר: כָּל שֶׁלֹּא אָמַר שְׁלֹשָׁה דְבָרִים אֵלּוּ בַּפֶּסַח, לֹא יָצָא יְדֵי חוֹבָתוֹ.", dur:8000},
  {say:'leader', en:"The Pesach offering — because God passed over our houses. The leader points to the shank bone.", he:"פֶּסַח — עַל שׁוּם שֶׁפָּסַח הַקָּדוֹשׁ בָּרוּךְ הוּא עַל בָּתֵּי אֲבוֹתֵינוּ.", dur:7000},
  {say:'leader', en:"This matzah — because our dough had no time to rise. The leader lifts the matzah.", he:"מַצָּה זוֹ — עַל שׁוּם שֶׁלֹּא הִסְפִּיק בְּצֵקָם לְהַחֲמִיץ.", dur:7000},
  {say:'leader', en:"This bitter herb — because the Egyptians embittered our lives. The leader points to the maror.", he:"מָרוֹר זֶה — עַל שׁוּם שֶׁמֵּרְרוּ הַמִּצְרִים אֶת חַיֵּי אֲבוֹתֵינוּ.", dur:7000},

  // Ten Plagues
  {say:'leader', en:"The ten plagues. For each we spill a drop of wine — our joy cannot be complete when others suffer.", he:"עֶשֶׂר מַכּוֹת. שׁוֹפְכִים טִפָּה כִּי אֵין שִׂמְחָתֵנוּ שְׁלֵמָה.", dur:5000},
  ...['דָּם · Blood','צְפַרְדֵּעַ · Frogs','כִּנִּים · Lice','עָרוֹב · Beasts','דֶּבֶר · Pestilence','שְׁחִין · Boils','בָּרָד · Hail','אַרְבֶּה · Locusts','חֹשֶׁךְ · Darkness','מַכַּת בְּכוֹרוֹת · Firstborn'].map(p=>({say:'all' as const, en:p.split('·')[1]?.trim()||p, he:p.split('·')[0]?.trim()||'', dur:1800})),
  {react:true, ctx:'Finished ten plagues, spilling wine for each. We diminish joy because even enemies\' suffering diminishes ours. Powerful moral teaching.', chars:['guest','child_simple','child_wicked','leader'], max:2},

  // Dayenu
  {say:'leader', en:"How many levels of goodness has God bestowed upon us!", he:"כַּמָּה מַעֲלוֹת טוֹבוֹת לַמָּקוֹם עָלֵינוּ!", dur:3500},
  {melody:'Dayenu'},
  {say:'all', en:"Had He brought us out of Egypt — DAYENU!", he:"אִלּוּ הוֹצִיאָנוּ מִמִּצְרַיִם — דַּיֵּנוּ!", dur:4500},
  {say:'all', en:"Had He given us the Shabbat — DAYENU!", he:"אִלּוּ נָתַן לָנוּ אֶת הַשַׁבָּת — דַּיֵּנוּ!", dur:3500},
  {say:'all', en:"Had He given us the Torah — DAYENU!", he:"אִלּוּ נָתַן לָנוּ אֶת הַתּוֹרָה — דַּיֵּנוּ!", dur:3500},
  {say:'all', en:"Had He brought us to Israel — DAYENU!", he:"אִלּוּ הִכְנִיסָנוּ לְאֶרֶץ יִשְׂרָאֵל — דַּיֵּנוּ!", dur:3500},
  {react:true, ctx:'Dayenu! Uncle Moshe loudest as always. Song builds with joy and gratitude. Even the teen singing. Guest clapping.', chars:['uncle','child_wicked','guest','mother'], max:2},
  {react:true, ctx:'Second cup being poured by others. Everyone leans left to drink — free people tonight.', chars:['father','uncle'], max:1},
  {act:'drink'},

  // RACHTZAH + MOTZI MATZAH
  {phase:'רָחְצָה · מוֹצִיא מַצָּה'},
  {say:'leader', en:"Now we wash WITH a blessing.", he:"בָּרוּךְ אַתָּה ה׳, וְצִוָּנוּ עַל נְטִילַת יָדָיִם.", dur:5000},
  {say:'leader', en:"Blessed are You, Lord, who brings forth bread from the earth.", he:"בָּרוּךְ אַתָּה ה׳, הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ.", dur:5000},
  {say:'leader', en:"Blessed are You, Lord, who commanded us to eat matzah.", he:"בָּרוּךְ אַתָּה ה׳, וְצִוָּנוּ עַל אֲכִילַת מַצָּה.", dur:5000},
  {act:'eat'},
  {react:true, ctx:'Everyone eating matzah, leaning left. Bread of affliction AND freedom — a paradox. Very dry and crumbly.', chars:['saba','savta','child_wicked','guest'], max:2},

  // MAROR
  {phase:'מָרוֹר · Maror — Bitter Herb'},
  {react:true, ctx:'Passing the maror (horseradish) and charoset (sweet apple-wine-nut paste) around. Everyone takes maror and dips in charoset.', chars:['mother','father'], max:1},
  {say:'leader', en:"Blessed are You, Lord, who commanded us to eat bitter herbs.", he:"בָּרוּךְ אַתָּה ה׳, וְצִוָּנוּ עַל אֲכִילַת מָרוֹר.", dur:6000},
  {act:'eat'},
  {react:true, ctx:'Everyone ate horseradish dipped in charoset. VERY strong — tears in eyes. We taste slavery so we don\'t just remember intellectually. Grandfather ate it unflinching.', chars:['child_young','guest','saba','savta','uncle'], max:3},

  // KORECH
  {phase:'כּוֹרֵךְ · Korech — Hillel\'s Sandwich'},
  {say:'leader', en:"As Hillel did in the Temple: matzah, maror, and charoset wrapped together.", he:"זֵכֶר לְמִקְדָּשׁ כְּהִלֵּל. כָּרַךְ מַצָּה וּמָרוֹר וְאָכַל בְּיַחַד.", dur:7000},
  {act:'eat'},
  {react:true, ctx:'Making Hillel sandwiches. Hillel invented the sandwich 2000 years before the Earl of Sandwich. Bitter and sweet together.', chars:['child_wicked','child_wise','guest'], max:2},

  // SHULCHAN ORECH — THE MEAL
  {phase:'שֻׁלְחָן עוֹרֵךְ · The Festive Meal!'},
  {react:true, ctx:'THE MEAL! Kids waited hours. Grandmother bringing soup. The table IS the altar — eating together IS the ritual.', chars:['child_young','child_simple','savta','uncle'], max:3},
  {act:'move',who:'mother',to:{x:160,y:100},dur:1200},{act:'move',who:'aunt',to:{x:160,y:130},dur:1200},
  {act:'move',who:'mother',to:{x:280,y:290},dur:1200},{act:'move',who:'aunt',to:{x:760,y:440},dur:1200},
  {act:'eat'},
  {react:true, ctx:'Meal underway. Grandmother pushing food. Chicken soup, gefilte fish. Grandfather has fallen asleep. People talking, laughing, sharing stories.', chars:['savta','saba','uncle','mother','father'], max:3},
  {react:true, ctx:'Grandfather asleep. Teen might prank him. Father telling a story. Aunt helping clear. Leader should remind everyone there\'s more Seder.', chars:['saba','child_wicked','father','aunt','leader'], max:2},

  // TZAFUN — AFIKOMAN HUNT
  {phase:'צָפוּן · Tzafun — Afikoman Hunt!'},
  {react:true, ctx:'Afikoman time! Father hid it earlier. Children searching. Noa (8) is the champion. Eli (6) never wins. Winner negotiates a prize.', chars:['father','child_young','child_simple'], max:2},
  {act:'move',who:'child_young',to:{x:850,y:140},dur:800},
  {act:'move',who:'child_simple',to:{x:160,y:500},dur:800},
  {act:'move',who:'child_young',to:{x:850,y:170},dur:500},
  {react:true, ctx:'Noa found the Afikoman! Negotiating prize — starts with iPad, settles for ice cream. The Afikoman MUST be eaten — last food of the night. Nothing after.', chars:['child_young','father','mother','child_simple','child_wicked'], max:3},
  {act:'move',who:'child_young',to:{x:260,y:470},dur:1000},{act:'move',who:'child_simple',to:{x:780,y:510},dur:1000},
  {act:'eat'},

  // BARECH + ELIJAH
  {phase:'בָּרֵךְ · Barech — Grace & Elijah'},
  {say:'leader', en:"Blessed are You, Lord, who sustains the world with goodness, grace, and compassion.", he:"בָּרוּךְ אַתָּה ה׳, הַזָּן אֶת הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ, בְּחֵן בְּחֶסֶד וּבְרַחֲמִים.", dur:7000},
  {react:true, ctx:'Third cup poured by others. Then we pour Elijah\'s cup — special golden goblet in center, filled to brim for the prophet.', chars:['father','uncle','mother'], max:1},
  {act:'drink'},
  {act:'stand',who:'leader'},
  {say:'leader', en:"We now open the door for Elijah the Prophet!", he:"פותחים את הדלת לאליהו הנביא!", dur:3500},
  {act:'door'},
  {react:true, ctx:'THE DOOR IS OPEN FOR ELIJAH. Candles flickered. Warm breeze. Everyone watching Elijah\'s golden cup — did the wine level drop? Magical moment. Children wide-eyed. Even the teen is looking.', chars:['child_simple','savta','guest','child_young','child_wicked'], max:3},
  {say:'all', en:"Elijah the Prophet, Elijah the Tishbite — may he come speedily in our days, with the Messiah!", he:"אֵלִיָּהוּ הַנָּבִיא, אֵלִיָּהוּ הַתִּשְׁבִּי, אֵלִיָּהוּ הַגִּלְעָדִי, בִּמְהֵרָה בְיָמֵינוּ יָבוֹא אֵלֵינוּ, עִם מָשִׁיחַ בֶּן דָּוִד.", dur:10000},
  {act:'sit',who:'leader'},

  // HALLEL
  {phase:'הַלֵּל · Hallel — Songs of Praise!'},
  {react:true, ctx:'Fourth cup being poured. Most joyful part — pure praise and singing. We SING after telling the story.', chars:['uncle','leader'], max:1},
  {say:'all', en:"Give thanks to the Lord for He is good, His kindness endures forever!", he:"הוֹדוּ לַה׳ כִּי טוֹב, כִּי לְעוֹלָם חַסְדּוֹ!", dur:5000},
  {melody:'Chad Gadya'},
  {act:'drink'},
  {say:'all', en:"One little goat, one little goat, that father bought for two zuzim!", he:"חַד גַּדְיָא, חַד גַּדְיָא, דְּזַבִּין אַבָּא בִּתְרֵי זוּזֵי!", dur:6000},
  {react:true, ctx:'Chad Gadya gets faster each verse. Uncle banging table. Chaotic and joyful. Even the teen singing full voice — the Seder won him over. Guest singing phonetically.', chars:['uncle','child_wicked','guest','child_young'], max:2},

  // NIRTZAH
  {phase:'נִרְצָה · Next Year in Jerusalem!'},
  {act:'stand',who:'all'},
  {say:'leader', en:"The Passover Seder is complete, according to all its laws. As we merited to perform it, so may we merit to do it again.", he:"חֲסַל סִדּוּר פֶּסַח כְּהִלְכָתוֹ, כְּכָל מִשְׁפָּטוֹ וְחֻקָּתוֹ. כַּאֲשֶׁר זָכִינוּ לְסַדֵּר אוֹתוֹ, כֵּן נִזְכֶּה לַעֲשׂוֹתוֹ.", dur:10000},
  {say:'all', en:"NEXT YEAR IN JERUSALEM!", he:"לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם!", dur:6000},
  {react:true, ctx:'Seder complete! Standing, hugging, crying. Children exhausted. Youngest wants her ice cream. Grandfather says it went fast. Guest deeply moved, thanks everyone. Grandmother thinking about next year. Teen won\'t admit it was meaningful to him.', chars:['child_young','saba','savta','guest','mother','child_wicked'], max:4},
  {act:'end'}
];

// CHARACTER SPRITE
function Char({c,x,y,talking,standing,t}:any){
  const sc=c.age==='child'?.65:c.age==='teen'?.8:1;
  const bob=talking?Math.sin(t*6)*2:0;
  const hBob=talking?Math.sin(t*4)*2:0;
  const aL=talking?Math.sin(t*3)*15:0;
  const aR=talking?-Math.sin(t*3.5)*12:0;
  const yO=standing?-6:0;
  const mo=talking?Math.abs(Math.sin(t*8))*3:0;
  
  return (
    <g transform={`translate(${x},${y+yO+bob}) scale(${sc})`} filter="url(#charShadow)">
      <defs>
        <linearGradient id={`grad-body-${c.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={c.color} />
          <stop offset="100%" stopColor={c.color} stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={`grad-head-${c.id}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={c.skin} />
          <stop offset="100%" stopColor={c.skin} stopOpacity="0.9" />
        </radialGradient>
      </defs>
      <ellipse cx={0} cy={30} rx={16} ry={5} fill="rgba(0,0,0,0.15)"/>
      <ellipse cx={0} cy={6} rx={12} ry={16} fill={`url(#grad-body-${c.id})`} stroke="#00000022" strokeWidth={.8}/>
      <path d="M-5,-7 Q0,-4 5,-7" fill="none" stroke="#FFFFFF15" strokeWidth={1}/>
      <g transform={`rotate(${aL} -12 0)`}>
        <line x1={-12} y1={0} x2={-20} y2={14} stroke={c.color} strokeWidth={6} strokeLinecap="round"/>
        <circle cx={-20} cy={15} r={3.5} fill={c.skin}/>
      </g>
      <g transform={`rotate(${aR} 12 0)`}>
        <line x1={12} y1={0} x2={20} y2={14} stroke={c.color} strokeWidth={6} strokeLinecap="round"/>
        <circle cx={20} cy={15} r={3.5} fill={c.skin}/>
      </g>
      <rect x={-3.5} y={-11} width={7} height={5} fill={c.skin} rx={2}/>
      <g transform={`translate(0,${hBob})`}>
        <ellipse cx={0} cy={-20} rx={13} ry={14} fill={`url(#grad-head-${c.id})`}/>
        {c.gender==='F'&&c.age!=='elder'?<><ellipse cx={0} cy={-28} rx={14} ry={9} fill={c.hair}/><ellipse cx={-11} cy={-16} rx={4.5} ry={12} fill={c.hair}/><ellipse cx={11} cy={-16} rx={4.5} ry={12} fill={c.hair}/></>:c.age==='elder'&&c.gender==='F'?<><ellipse cx={0} cy={-28} rx={14} ry={8} fill={c.hair}/>{Array.from({length:8}).map((_,i)=>{const a=(i/8)*Math.PI*2;return<circle key={i} cx={Math.cos(a)*10} cy={-26+Math.sin(a)*5} r={3} fill={c.hair}/>})}</>:<ellipse cx={0} cy={-29} rx={12} ry={6} fill={c.hair} opacity={c.age==='elder'?.5:1}/>}
        {c.kippah&&<ellipse cx={1} cy={-32} rx={7} ry={3.5} fill="#1A1A4A"/>}
        <ellipse cx={-12.5} cy={-19} rx={2.5} ry={4} fill={c.skin}/>
        <ellipse cx={12.5} cy={-19} rx={2.5} ry={4} fill={c.skin}/>
        {[-5,5].map(ex=><g key={ex}>
          <ellipse cx={ex} cy={-21} rx={3.2} ry={3.5} fill="white"/>
          <circle cx={ex+(talking?Math.sin(t)*.5:0)} cy={-21} r={2} fill={c.age==='child'?'#4A3520':'#2A1A0A'}/>
          <circle cx={ex+(talking?Math.sin(t)*.5:0)} cy={-21} r={1} fill="#111"/>
          <circle cx={ex+.8} cy={-22} r={.6} fill="white" opacity={.8}/>
        </g>)}
        <line x1={-7.5} y1={-25} x2={-2.5} y2={-25.5} stroke={c.hair} strokeWidth={1} strokeLinecap="round"/>
        <line x1={2.5} y1={-25.5} x2={7.5} y2={-25} stroke={c.hair} strokeWidth={1} strokeLinecap="round"/>
        <ellipse cx={0} cy={-16} rx={2} ry={1.5} fill={c.skin} stroke="#00000012" strokeWidth={.3}/>
        {c.age==='child'&&<><circle cx={-7} cy={-15} r={3} fill="#FF8888" opacity={.15}/><circle cx={7} cy={-15} r={3} fill="#FF8888" opacity={.15}/></>}
        {mo>.5?<ellipse cx={0} cy={-12} rx={3} ry={mo} fill="#884444"/>:<path d="M-3.5,-12 Q0,-10 3.5,-12" stroke="#884444" strokeWidth={.8} fill="none"/>}
        {c.beard&&<><ellipse cx={0} cy={-8} rx={7} ry={6} fill={c.hair} opacity={.8}/><ellipse cx={0} cy={-12} rx={5} ry={2} fill={c.hair} opacity={.5}/></>}
        {c.age==='elder'&&c.gender==='M'&&<><circle cx={-5} cy={-21} r={4.5} fill="none" stroke="#555" strokeWidth={.7}/><circle cx={5} cy={-21} r={4.5} fill="none" stroke="#555" strokeWidth={.7}/><line x1={-.5} y1={-21} x2={.5} y2={-21} stroke="#555" strokeWidth={.7}/></>}
      </g>
      <text x={0} y={40} textAnchor="middle" fill="#C9B89A" fontSize={9} fontWeight={600}>{c.name}</text>
      <text x={0} y={49} textAnchor="middle" fill="#8B7355" fontSize={7}>{c.role}</text>
    </g>
  );
}

// ROOM
function Room({doorOpen,onPlateClick,eaten,cups,chars}:{doorOpen:boolean;onPlateClick?:(item:string)=>void;eaten:string[];cups:Record<string,number>;chars:any[]}){
  return<g>
    {/* Floor */}
    <rect x={0} y={0} width={1000} height={700} fill="#1a140d"/>
    {Array.from({length:18}).map((_,i)=><rect key={i} x={0} y={i*40} width={1000} height={39} fill={i%2?'#221a12':'#261c14'} stroke="#1a140d" strokeWidth={.5}/>)}
    
    {/* Walls */}
    <rect x={0} y={0} width={1000} height={100} fill="#2d2218"/>
    <rect x={0} y={90} width={1000} height={10} fill="#1a140d" opacity={.3}/>
    
    {/* Kitchen Area */}
    <rect x={30} y={20} width={180} height={60} rx={3} fill="#3D3025" stroke="#4A3C2A" strokeWidth={1}/>
    <text x={120} y={105} textAnchor="middle" fill="#5A4D3C" fontSize={9}>🍳 Kitchen</text>
    
    {/* Bookshelf */}
    <rect x={780} y={15} width={130} height={70} rx={2} fill="#4A3520"/>
    {[0,1,2].map(r=><g key={r}><rect x={784} y={20+r*22} width={122} height={18} fill="#3D2A15"/>{Array.from({length:8}).map((_,b)=><rect key={b} x={786+b*15} y={20+r*22+(18-(12+b%3*3))} width={10} height={12+b%3*3} rx={1} fill={['#8B1A1A','#1A3A6B','#2E5A37','#6B4A1A','#4A1A5A','#1A5A4A','#8B6B1A','#3A1A1A'][b%8]}/>)}</g>)}
    
    {/* Door */}
    <rect x={940} y={150} width={45} height={120} rx={2} fill={doorOpen?'#0a0a1a':'#4a2e18'} stroke="#5a3d20" strokeWidth={2}/>
    <circle cx={948} cy={210} r={3} fill="#DAA520"/>
    {doorOpen&&<text x={962} y={215} textAnchor="middle" fill="#FFD70066" fontSize={20}>✨</text>}

    {/* THE TABLE - Large and Central */}
    <ellipse cx={500} cy={420} rx={420} ry={220} fill="#3d2b1f" stroke="#4d3b2f" strokeWidth={4}/>
    <ellipse cx={500} cy={420} rx={390} ry={195} fill="#453226" opacity={.8}/>
    
    {/* Tablecloth */}
    <ellipse cx={500} cy={415} rx={360} ry={170} fill="#fdfaf0" stroke="#eee" strokeWidth={1}/>
    <ellipse cx={500} cy={415} rx={340} ry={155} fill="none" stroke="#f0e8d0" strokeWidth={.5} strokeDasharray="10,5"/>

    {/* Seder Plate */}
    <circle cx={500} cy={415} r={65} fill="#d4bc8a" stroke="#b89860" strokeWidth={2}/>
    <circle cx={500} cy={415} r={58} fill="none" stroke="#c8a870" strokeWidth={1}/>
    {[{a:0,c:'#4A7A3A',n:'Karpas'},{a:1,c:'#8B4513',n:'Zeroa'},{a:2,c:'#F5DEB3',n:'Egg'},{a:3,c:'#8B6040',n:'Charoset'},{a:4,c:'#3A6A2A',n:'Maror'},{a:5,c:'#2A5A1A',n:'Chazeret'}].map(({a,c,n},i)=>{const ang=(a/6)*Math.PI*2-Math.PI/2;const isEaten=eaten.includes(n);return<g key={i} onClick={()=>onPlateClick?.(n)} style={{cursor:'pointer',opacity:isEaten?.2:1,transition:'opacity .5s'}}><circle cx={500+Math.cos(ang)*35} cy={415+Math.sin(ang)*35} r={10} fill={c} stroke="#00000022" strokeWidth={.5}/><text x={500+Math.cos(ang)*35} y={415+Math.sin(ang)*35+2} textAnchor="middle" fill="#00000088" fontSize={5} fontWeight={600}>{n}</text></g>})}

    {/* Matzah Box */}
    <rect x={380} y={380} width={50} height={45} rx={3} fill="#D2B48C" stroke="#c0a080" strokeWidth={.5}/>
    <rect x={378} y={378} width={54} height={8} rx={2} fill="#F0E8D8"/>
    
    {/* Elijah's Cup */}
    <rect x={580} y={375} width={18} height={28} rx={4} fill="#DAA520" stroke="#b8860b" strokeWidth={1}/>
    <rect x={577} y={372} width={24} height={6} rx={2} fill="#DAA520"/>
    <text x={589} y={415} textAnchor="middle" fill="#D4A017" fontSize={6} fontWeight={600}>Elijah</text>

    {/* Candles */}
    {[-25, 0, 25].map(dx=><g key={dx} transform={`translate(${500+dx}, 320)`}>
      <rect x={-2} y={0} width={4} height={35} fill="#C0C0C0" rx={1}/>
      <rect x={-2} y={-12} width={4} height={14} fill="#FFF8DC" rx={1}/>
      <ellipse cx={0} cy={-14} rx={3} ry={4} fill="#FFD700" opacity={.9} filter="url(#candleGlow)">
        <animate attributeName="ry" values="4;5;3.5;4.5;4" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.8;1;0.7;0.9;0.8" dur="3s" repeatCount="indefinite" />
      </ellipse>
    </g>)}

    {/* Individual Place Settings */}
    {chars.map(c=>{
      const s=c.seat;
      // Calculate angle from center to seat to position plate/cup
      const ang = Math.atan2(s.y - 415, s.x - 500);
      const px = s.x - Math.cos(ang) * 45;
      const py = s.y - Math.sin(ang) * 45;
      const cupLevel=cups[c.id]||0;
      
      return <g key={c.id+'set'}>
        {/* Plate */}
        <circle cx={px} cy={py} r={18} fill="#FAF8F0" stroke="#DDD" strokeWidth={.5}/>
        <circle cx={px} cy={py} r={14} fill="none" stroke="#E8E0D0" strokeWidth={.3}/>
        {/* Cup */}
        <g transform={`translate(${px + 22}, ${py - 10})`}>
          <ellipse cx={0} cy={0} rx={5} ry={6} fill="none" stroke="#C8C8C8" strokeWidth={.5}/>
          <ellipse cx={0} cy={2 + (6-(cupLevel%5)*1.4)} rx={4} ry={Math.max(0, (cupLevel%5)*1.0)} fill="#722F37" opacity={.6}/>
        </g>
        {/* Haggadah */}
        <rect x={px-30} y={py+5} width={20} height={25} rx={2} fill="#8B1A1A" opacity={.8} transform={`rotate(${ang * 57}, ${px-20}, ${py+15})`}/>
      </g>
    })}

    {/* Ambient Glow */}
    <radialGradient id="glow" cx="500" cy="350" r="300" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#FFAA33" stopOpacity="0.15">
        <animate attributeName="stop-opacity" values="0.12;0.18;0.14;0.2;0.12" dur="4s" repeatCount="indefinite" />
      </stop>
      <stop offset="100%" stopColor="#FFAA33" stopOpacity="0"/>
    </radialGradient>
    <rect x={0} y={0} width={1000} height={700} fill="url(#glow)" pointerEvents="none"/>
  </g>
}

// BUBBLE
function Bubble({x,y,text,he,isMobile}:any){if(!text&&!he)return null;const sc=isMobile?.6:1;const bx=Math.max(120*sc,Math.min(1000-120*sc,x));return<foreignObject x={bx-110*sc} y={Math.max(10,y-70*sc)} width={220*sc} height={120*sc} style={{overflow:'visible'}}><div style={{background:'rgba(15,12,8,.94)',border:'1px solid #D4A01755',borderRadius:12*sc,padding:`${7*sc}px ${11*sc}px`,color:'#F5F0E0',fontSize:12*sc,lineHeight:1.4,backdropFilter:'blur(6px)',boxShadow:'0 4px 20px rgba(0,0,0,.5)'}}>{he&&<div style={{direction:'rtl',textAlign:'right',marginBottom:text?4*sc:0,fontSize:13*sc}}>{he}</div>}{text&&<div style={{fontStyle:he?'italic':'normal',color:he?'#B8A88A':'#F5F0E0',fontSize:he?11*sc:12*sc}}>{text}</div>}</div></foreignObject>}

// PROFILE PANEL
function ProfilePanel({charId,onClose,isMobile,onUpdate}:{charId:string;onClose:()=>void;isMobile?:boolean;onUpdate?:()=>void}){
  const[md,setMd]=useState('Loading...');
  const[meta,setMeta]=useState<any>(null);
  const[editing,setEditing]=useState(false);
  const[saving,setSaving]=useState(false);
  
  useEffect(()=>{
    fetch(`/api/characters?id=${charId}&type=md`).then(r=>r.ok?r.text():'Not found').then(setMd).catch(()=>setMd('Error'));
    fetch(`/api/characters?id=${charId}&type=meta`).then(r=>r.ok?r.json():null).then(setMeta).catch(()=>setMeta(null));
  },[charId]);

  const save=async()=>{
    setSaving(true);
    try {
      await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: charId, content: md })
      });
      await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: charId, meta, type: 'meta' })
      });
      setEditing(false);
      onUpdate?.();
    } catch (e) {
      alert('Error saving profile');
    }
    setSaving(false);
  };

  if(!meta) return null;

  return<div style={{position:'absolute',top:0,right:0,width:isMobile?'100%':340,height:'100%',background:'rgba(15,12,8,.97)',borderLeft:'1px solid #3D3428',zIndex:50,overflow:'auto',padding:16}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div><b style={{color:'#E8D5B7',fontSize:16}}>{meta.name}</b><span style={{color:'#8B7355',fontSize:12,marginLeft:8}}>{meta.role}</span></div><button onClick={onClose} style={{background:'none',border:'none',color:'#8B7355',fontSize:18,cursor:'pointer'}}>✕</button></div>
    {editing ? (
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:16}}>
        <div style={{display:'flex',gap:8}}><input value={meta.name} onChange={e=>setMeta({...meta,name:e.target.value})} placeholder="Name" style={is}/> <input value={meta.role} onChange={e=>setMeta({...meta,role:e.target.value})} placeholder="Role" style={is}/></div>
        <div style={{display:'flex',gap:8}}>
          <select value={meta.gender} onChange={e=>setMeta({...meta,gender:e.target.value})} style={is}><option value="M">Male</option><option value="F">Female</option></select>
          <select value={meta.age} onChange={e=>setMeta({...meta,age:e.target.value})} style={is}><option value="child">Child</option><option value="teen">Teen</option><option value="adult">Adult</option><option value="elder">Elder</option></select>
        </div>
      </div>
    ) : null}
    <div style={{color:'#5A4D3C',fontSize:10,marginBottom:8}}>This profile is read by the AI to generate dialogue. Edit it to change how this character behaves at the Seder.</div>
    {editing?<textarea value={md} onChange={e=>setMd(e.target.value)} style={{width:'100%',height:'50vh',background:'#1A1410',color:'#D4C5A9',border:'1px solid #3D3428',borderRadius:8,padding:10,fontSize:11,lineHeight:1.5,resize:'none',outline:'none',fontFamily:'monospace'}}/>:<pre style={{color:'#D4C5A9',fontSize:11,lineHeight:1.5,whiteSpace:'pre-wrap',background:'#1A1410',borderRadius:8,padding:10,border:'1px solid #3D3428',maxHeight:'60vh',overflow:'auto'}}>{md}</pre>}
    <div style={{display:'flex',gap:8,marginTop:8}}>{editing?(<><button onClick={save} disabled={saving} style={{background:'#2A2118',border:'1px solid #3D3428',color:'#7EC87E',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:11}}>{saving?'Saving...':'Save Changes'}</><button onClick={()=>setEditing(false)} style={{background:'#2A2118',border:'1px solid #3D3428',color:'#8B7355',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:11}}>Cancel</button></>):(<button onClick={()=>setEditing(true)} style={{background:'#2A2118',border:'1px solid #3D3428',color:'#D4A017',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:11}}>Edit Profile</button>)}</div></div>
}

// MAIN
export default function Seder(){
  const[go,setGo]=useState(false);
  const[tradition,setTradition]=useState<'ashkenazi'|'sephardi'>('ashkenazi');
  const[speakLang,setSpeakLang]=useState<'en'|'he'|'both'>('en');
  const[svc,setSvc]=useState({hasEL:false,hasAI:false,elevenlabsCustomVoice:false});
  const[chars,setChars]=useState<any[]>([]);
  const[pos,setPos]=useState<Record<string,{x:number;y:number}>>({});
  const[spk,setSpk]=useState<string|null>(null);
  const[standing,setStanding]=useState<string[]>([]);
  const[bub,setBub]=useState<any>(null);
  const[phase,setPhase]=useState('');
  const[sub,setSub]=useState({he:'',en:''});
  const[bi,setBi]=useState(0);
  const[paused,setPaused]=useState(false);
  const[speed,setSpeed]=useState(1);
  const[done,setDone]=useState(false);
  const[shH,setShH]=useState(true);
  const[shE,setShE]=useState(true);
  const[audOn,setAudOn]=useState(true);
  const[cups,setCups]=useState<Record<string,number>>({});
  const[eaten,setEaten]=useState<string[]>([]);
  const[doorOpen,setDoorOpen]=useState(false);
  const[cam,setCam]=useState({x:180,y:130,w:640,h:500});
  const[t,setT]=useState(0);
  const[profileChar,setProfileChar]=useState<string|null>(null);
  const[showSettings,setShowSettings]=useState(false);
  const[isMobile,setIsMobile]=useState(false);
  const[history,setHistory]=useState<string[]>([]);
  const hRef=useRef<string[]>([]);
  useEffect(()=>{hRef.current=history},[history]);

  const loadChars=()=>fetch('/api/characters?type=all').then(r=>r.ok?r.json():[]).then(data=>{
    if(data.length){
      setChars(data);
      setPos(Object.fromEntries(data.map((c:any)=>[c.id,{...c.seat}])));
    }
  });

  useEffect(()=>{loadChars()},[]);
  useEffect(()=>{setIsMobile(window.innerWidth<768);const ck=()=>setIsMobile(window.innerWidth<768);window.addEventListener('resize',ck);return()=>window.removeEventListener('resize',ck)},[]);
  const engRef=useRef<Engine|null>(null);
  const pRef=useRef(false);const sRef=useRef(1);

  useEffect(()=>{pRef.current=paused},[paused]);
  useEffect(()=>{sRef.current=speed},[speed]);
  useEffect(()=>{if(!go)return;let r:number;const f=()=>{setT(v=>v+.016);r=requestAnimationFrame(f)};r=requestAnimationFrame(f);return()=>cancelAnimationFrame(r)},[go]);
  useEffect(()=>{new Engine().init().then(setSvc)},[]);
  useEffect(()=>{
    const e=engRef.current;
    if(!e||!go)return;
    e.playbackSpeed=speed;
    e.syncPlaybackSpeed();
  },[speed,go]);
  useEffect(()=>{
    const e=engRef.current;
    if(!e||!go)return;
    if(paused)e.pausePlayback();
    else e.resumePlayback();
  },[paused,go]);

  const wt=(ms:number)=>new Promise<void>(r=>{const ck=()=>{if(!pRef.current){ms-=16*sRef.current;if(ms<=0)r();else setTimeout(ck,16)}else setTimeout(ck,100)};ck()});
  /** Movement respects pause + speed (faster pace = quicker walks). */
  const mv=(w:string,to:{x:number;y:number},dur:number)=>new Promise<void>(r=>{
    const st={...(pos[w]||chars.find(c=>c.id===w)?.seat||{x:500,y:400})};
    const sp=sRef.current;
    const totalMs=dur/sp;
    const tickMs=Math.max(8,30/sp);
    const n=Math.max(1,Math.round(totalMs/tickMs));
    let step=0;
    const frame=()=>{
      const tick=()=>{
        if(pRef.current){setTimeout(tick,100);return}
        step++;
        const p=Math.min(1,step/n);
        const e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
        setPos(prev=>({...prev,[w]:{x:st.x+(to.x-st.x)*e,y:st.y+(to.y-st.y)*e}}));
        if(step<n)setTimeout(frame,tickMs);else r();
      };
      tick();
    };
    frame();
  });

  const zoom=(to:{x:number,y:number,w:number,h:number},dur:number)=>new Promise<void>(r=>{
    const st={...cam};
    const sp=sRef.current;
    const n=Math.max(1,Math.round((dur/sp)/16));
    let step=0;
    const f=()=>{
      if(pRef.current){setTimeout(f,100);return}
      step++;
      const p=Math.min(1,step/n);
      const e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
      setCam({
        x:st.x+(to.x-st.x)*e,
        y:st.y+(to.y-st.y)*e,
        w:st.w+(to.w-st.w)*e,
        h:st.h+(to.h-st.h)*e
      });
      if(step<n)requestAnimationFrame(f);else r();
    };
    f();
  });

  const run=async()=>{
    const eng=new Engine();await eng.init();
    eng.audioEnabled=audOn;eng.speakLang=speakLang;eng.tradition=tradition;
    eng.playbackSpeed=speed;
    engRef.current=eng;
    void eng.startAmbient();

    const CM: Record<string, any> = Object.fromEntries(chars.map(c => [c.id, c]));

    for(let i=0;i<SCRIPT.length;i++){
      while(pRef.current)await new Promise(r=>setTimeout(r,200));
      const b=SCRIPT[i];setBi(i);
      if(b.phase){
        setPhase(b.phase);setBub(null);setSpk(null);setSub({he:'',en:''});
        if(isMobile){
          if(b.phase.includes('Kadesh')||b.phase.includes('Karpas')||b.phase.includes('Yachatz')) await zoom({x:300,y:200,w:400,h:300},1500);
          else if(b.phase.includes('Meal')) await zoom({x:200,y:100,w:600,h:450},2000);
          else if(b.phase.includes('Elijah')) await zoom({x:600,y:150,w:400,h:300},1500);
          else await zoom({x:180,y:130,w:640,h:500},1500);
        }
        await wt(3000);continue;
      }
      if(b.act==='end'){setDone(true);return}
      if(b.act==='stand'){setStanding(s=>{const ids=b.who==='all'?chars.map(c=>c.id):[b.who];return[...new Set([...s,...ids])]});await wt(500);continue}
      if(b.act==='sit'){setStanding(s=>b.who==='all'?[]:s.filter((id:string)=>id!==b.who));await wt(500);continue}
      if(b.act==='move'){await mv(b.who,b.to,b.dur||1000);continue}
      if(b.act==='drink'||b.act==='eat'){
        setSub({he:'',en:b.act==='drink'?'Everyone drinks, leaning left! 🍷':'Everyone eats!'});
        if(b.act==='drink')setCups(prev=>{const n={...prev};chars.forEach(c=>n[c.id]=(n[c.id]||0)+1);return n});
        if(b.act==='eat'){
          if(phase.includes('Karpas'))setEaten(prev=>[...prev,'Karpas']);
          if(phase.includes('Maror'))setEaten(prev=>[...prev,'Maror']);
          if(phase.includes('Korech'))setEaten(prev=>[...prev,'Charoset','Chazeret']);
          if(phase.includes('Meal'))setEaten(prev=>[...prev,'Zeroa','Egg']);
        }
        await wt(3000);continue;
      }
      if(b.act==='door'){setDoorOpen(true);setSub({he:'',en:'The door opens... the candles flicker... ✨'});await wt(5000);setDoorOpen(false);continue}
      if(b.melody){void engRef.current?.playMelody(b.melody);continue}

      // AGENTIC — AI reads .md files, generates unique dialogue
      if(b.react){
        const rxs=await eng.react(b.ctx,b.chars,phase,b.max||2,hRef.current);
        for(const rx of rxs){
          if(!rx.en&&!rx.he)continue;
          const c=CM[rx.speaker]||CM.leader;const p=pos[rx.speaker]||c.seat;
          setSpk(rx.speaker);setSub({he:rx.he||'',en:rx.en||''});
          setBub({x:p.x,y:p.y,text:rx.en,he:rx.he});
          setHistory(prev=>[...prev.slice(-10),`${c.name}: ${rx.en}`]);
          await Promise.race([eng.speakLine(rx.en,rx.he,rx.speaker),wt(Math.max((rx.en||rx.he).length*75,2500))]);
          setSpk(null);setBub(null);await wt(400);
        }
        continue;
      }

      // FIXED LITURGY — prayers always in Hebrew, translation in English
      if(b.say){
        const c=CM[b.say]||CM.leader;const p=pos[b.say]||c.seat;
        setSpk(b.say);setSub({he:b.he||'',en:b.en||''});
        setBub({x:p.x,y:p.y,text:b.en,he:b.he});
        await Promise.race([eng.speakLine(b.en||'',b.he||'',b.say==='all'?'leader':b.say),wt(b.dur||Math.max((b.en||b.he||'').length*75,2500))]);
        setSpk(null);setBub(null);await wt(250);
      }
    }
  };

  const start=()=>{
    unlockWebAudio();
    setGo(true);
    setTimeout(run,500);
  };
  const sc=spk?chars.find(c=>c.id===spk):null;

  // SPLASH
  if(!go)return(
    <div style={{minHeight:'100dvh',background:'radial-gradient(ellipse at 40% 30%,#2A1F14,#0C0906 70%)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Crimson Pro',Georgia,serif",padding:20}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
        @keyframes flicker{0%,100%{opacity:1;filter:brightness(1)}40%{opacity:.8;filter:brightness(1.2)}60%{opacity:.9;filter:brightness(1.1)}}
        @keyframes glowFlicker{0%,100%{opacity:.08}40%{opacity:.12}60%{opacity:.1}80%{opacity:.14}}
      `}</style>
      <div style={{textAlign:'center',animation:'fadeIn 2s',maxWidth:500}}>
        <div style={{fontSize:48,marginBottom:20,display:'flex',justifyContent:'center',gap:32}}><span style={{animation:'flicker 4s infinite'}}>🕯️</span><span style={{animation:'flicker 4s infinite 1s'}}>🕯️</span></div>
        <h1 style={{color:'#FAF0E6',fontSize:isMobile?36:44,fontWeight:200,margin:0}}>The Agentic Seder</h1>
        <div style={{color:'#8B7355',fontSize:32,margin:'4px 0 16px'}}>הַסֵּדֶר</div>
        <p style={{color:'#8B7355',fontSize:12,lineHeight:1.6,maxWidth:380,margin:'0 auto 16px'}}>A complete Passover Seder conducted by 12 AI characters. Every viewing is unique — the AI reads personality files and generates fresh dialogue. Prayers always in Hebrew. Full Seder choreography.</p>
        <div style={{display:'flex',justifyContent:'center',gap:10,marginBottom:12}}>
          {(['ashkenazi','sephardi'] as const).map(t=><button key={t} onClick={()=>setTradition(t)} style={{background:tradition===t?'#D4A01733':'#1A1410',border:`1px solid ${tradition===t?'#D4A017':'#3D3428'}`,color:tradition===t?'#D4A017':'#8B7355',borderRadius:8,padding:'6px 16px',cursor:'pointer',fontSize:12}}>{t==='ashkenazi'?'Ashkenazi':'Sephardi'}</button>)}
        </div>
        <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:12}}>
          <span style={{color:'#5A4D3C',fontSize:11,alignSelf:'center'}}>Speak:</span>
          {([['en','English'],['he','עברית'],['both','Both']] as const).map(([v,l])=><button key={v} onClick={()=>setSpeakLang(v as any)} style={{background:speakLang===v?'#3A2A10':'#1A1410',border:`1px solid ${speakLang===v?'#D4A017':'#3D3428'}`,color:speakLang===v?'#D4A017':'#5A4D3C',borderRadius:6,padding:'4px 12px',cursor:'pointer',fontSize:11}}>{l}</button>)}
        </div>
        <div style={{color:'#5A4D3C',fontSize:10,marginBottom:8,lineHeight:1.8}}>
          {svc.hasAI?'🟢 AI Dialogue (Claude reads .md profiles)':'⚪ Fallback dialogue'}<br/>
          {svc.hasEL?(svc.elevenlabsCustomVoice?'🟢 ElevenLabs (your voice ID on server)':'🟢 Natural voices (ElevenLabs)'):'⚪ Browser voices'}
        </div>
        {svc.hasEL && !svc.elevenlabsCustomVoice && (
          <p style={{color:'#6A5D4C',fontSize:9,maxWidth:420,margin:'0 auto 14px',lineHeight:1.45}}>
            If you see <code style={{fontSize:8,color:'#8B7355'}}>paid_plan_required</code>: the API key must be from a <strong>paid</strong> workspace (regenerate the key after upgrading). Or set <code style={{fontSize:8,color:'#8B7355'}}>ELEVENLABS_DEFAULT_VOICE_ID</code> in Vercel to a voice ID from <em>your</em> ElevenLabs account (not the built‑in library list).
          </p>
        )}
        {svc.hasEL && svc.elevenlabsCustomVoice && (
          <p style={{color:'#6A5D4C',fontSize:9,margin:'0 auto 14px'}}>Using <code style={{fontSize:8}}>ELEVENLABS_DEFAULT_VOICE_ID</code> for all characters.</p>
        )}
        <button onClick={start} style={{background:'linear-gradient(135deg,#8B1A1A,#4A0A0A)',color:'#FAF0E6',border:'none',borderRadius:12,padding:'15px 46px',fontSize:18,cursor:'pointer',fontFamily:"'Crimson Pro',serif",boxShadow:'0 4px 30px rgba(139,26,26,.3)'}}>Light the Candles</button>
        <div style={{color:'#3D3428',fontSize:10,marginTop:16}}>github.com/skzebulon/agentic-seder · Open Source</div>
      </div>
    </div>
  );

  const is = {background:'#1A1410',color:'#D4C5A9',border:'1px solid #3D3428',borderRadius:6,padding:'4px 8px',fontSize:11,outline:'none',width:'100%'};

  // MAIN SCENE
  return(
    <div style={{width:'100vw',height:'100dvh',background:'#1A1410',overflow:'hidden',fontFamily:"'Crimson Pro',Georgia,serif",display:'flex',flexDirection:'column',position:'relative'}}>
      {phase&&<div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',background:'rgba(12,9,5,.92)',border:'1px solid #D4A01744',borderRadius:10,padding:'5px 18px',zIndex:20,whiteSpace:'nowrap'}}><div style={{color:'#D4A017',fontSize:isMobile?11:13,fontWeight:600}}>{phase}</div></div>}
      {sc&&<div style={{position:'absolute',top:isMobile?44:8,left:8,background:'rgba(12,9,5,.9)',borderRadius:8,padding:'4px 10px',zIndex:20,cursor:'pointer'}} onClick={()=>setProfileChar(spk)}><div style={{color:'#7EC87E',fontSize:8,letterSpacing:1.5}}>SPEAKING</div><div style={{color:'#E8D5B7',fontSize:12,fontWeight:600}}>{sc.name}</div><div style={{color:'#8B7355',fontSize:8}}>{sc.role} · click for profile</div></div>}
      <div style={{position:'absolute',top:8,right:8,display:'flex',gap:6,zIndex:20}}>
        <button onClick={()=>setShowSettings(!showSettings)} style={{background:'rgba(12,9,5,.9)',border:'1px solid #3D3428',color:'#D4A017',borderRadius:8,padding:'6px 10px',cursor:'pointer',fontSize:12}}>⚙️</button>
      </div>
      {showSettings&&<div style={{position:'absolute',top:40,right:8,background:'rgba(15,12,8,.97)',border:'1px solid #3D3428',borderRadius:10,padding:14,zIndex:50,width:260}}>
        <div style={{color:'#E8D5B7',fontSize:13,fontWeight:600,marginBottom:10}}>Settings</div>
        <div style={{color:'#8B7355',fontSize:11,marginBottom:6}}>Tradition</div>
        <div style={{display:'flex',gap:6,marginBottom:10}}>{(['ashkenazi','sephardi'] as const).map(t=><button key={t} onClick={()=>setTradition(t)} style={{background:tradition===t?'#D4A01733':'#1A1410',border:`1px solid ${tradition===t?'#D4A017':'#3D3428'}`,color:tradition===t?'#D4A017':'#5A4D3C',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:10}}>{t==='ashkenazi'?'Ashkenazi':'Sephardi'}</button>)}</div>
        <div style={{color:'#8B7355',fontSize:11,marginBottom:6}}>Speak</div>
        <div style={{display:'flex',gap:4,marginBottom:10}}>{([['en','EN'],['he','עב'],['both','Both']] as const).map(([v,l])=><button key={v} onClick={()=>{setSpeakLang(v as any);if(engRef.current)engRef.current.speakLang=v as any}} style={{background:speakLang===v?'#3A2A10':'#1A1410',border:`1px solid ${speakLang===v?'#D4A017':'#3D3428'}`,color:speakLang===v?'#D4A017':'#5A4D3C',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontSize:10}}>{l}</button>)}</div>
        <div style={{color:'#8B7355',fontSize:11,marginBottom:6}}>Profiles</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{chars.map(c=><button key={c.id} onClick={()=>{setProfileChar(c.id);setShowSettings(false)}} style={{background:'#1A1410',border:'1px solid #3D3428',color:'#D4C5A9',borderRadius:6,padding:'2px 8px',cursor:'pointer',fontSize:9}}>{c.name}</button>)}</div>
        <div style={{color:'#5A4D3C',fontSize:9,marginTop:8}}>{svc.hasAI?'🟢 Claude':'⚪ Fallback'} · {svc.hasEL?(svc.elevenlabsCustomVoice?'🟢 EL (custom voice)':'🟢 ElevenLabs'):'⚪ Browser'}</div>
      </div>}
      {profileChar&&<ProfilePanel charId={profileChar} onClose={()=>setProfileChar(null)} isMobile={isMobile} onUpdate={loadChars}/>}
      <svg viewBox={isMobile?`${cam.x} ${cam.y} ${cam.w} ${cam.h}`:"0 0 1000 700"} style={{flex:1,width:'100%'}}><Room doorOpen={doorOpen} eaten={eaten} cups={cups} chars={chars} onPlateClick={async(item)=>{
        if(!engRef.current)return;
        const ctx=`The user clicked on ${item} on the Seder plate. Explain its significance briefly in character.`;
        const rxs=await engRef.current.react(ctx,['leader','mother','child_wise'],phase,1,hRef.current);
        for(const rx of rxs){
          const c=chars.find(ch=>ch.id===rx.speaker)||chars.find(ch=>ch.id==='leader');const p=pos[rx.speaker]||c.seat;
          setSpk(rx.speaker);setSub({he:rx.he||'',en:rx.en||''});
          setBub({x:p.x,y:p.y,text:rx.en,he:rx.he});
          setHistory(prev=>[...prev.slice(-10),`${c.name}: ${rx.en}`]);
          await Promise.race([engRef.current.speakLine(rx.en,rx.he,rx.speaker),wt(Math.max((rx.en||rx.he).length*75,2500))]);
          setSpk(null);setBub(null);
        }
      }}/>{chars.map(c=>{const p=pos[c.id]||c.seat;return<Char key={c.id} c={c} x={p.x} y={p.y} talking={spk===c.id||spk==='all'} standing={standing.includes(c.id)} t={t}/>})}{!isMobile&&bub&&<Bubble x={bub.x} y={bub.y} text={bub.text} he={bub.he} isMobile={isMobile}/>}
      <filter id="charShadow">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodOpacity="0.3" />
      </filter>
      <filter id="candleGlow">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
        <feComposite in="SourceGraphic" in2="glow" operator="over" />
      </filter>
      </svg>
      {(sub.he||sub.en)&&<div style={{position:'absolute',bottom:isMobile?60:44,left:'50%',transform:'translateX(-50%)',width:'92%',maxWidth:620,background:'rgba(8,6,3,.93)',borderRadius:10,padding:'10px 16px',border:'1px solid #D4A01722',zIndex:10}}>{shH&&sub.he&&<p style={{color:'#FAF0E6',fontSize:isMobile?18:15,lineHeight:1.4,margin:0,direction:'rtl',textAlign:'right'}}>{sub.he}</p>}{shE&&sub.en&&<p style={{color:shH&&sub.he?'#B8A88A':'#FAF0E6',fontSize:isMobile?(shH&&sub.he?14:16):(shH&&sub.he?12:14),margin:shH&&sub.he?'4px 0 0':0,fontStyle:shH&&sub.he?'italic':'normal'}}>{sub.en}</p>}</div>}
      <div style={{padding:'5px 10px',background:'rgba(8,6,3,.95)',borderTop:'1px solid #1A1410',display:'flex',justifyContent:'space-between',alignItems:'center',gap:5,flexShrink:0}}>
        <div style={{display:'flex',gap:4,alignItems:'center',flexWrap:'wrap'}}><button onClick={()=>setPaused(p=>!p)} style={bs} title="Pause or resume">{paused?'▶':'⏸'}</button><span style={{color:'#5A4D3C',fontSize:8}}>Pace</span><select value={speed} onChange={e=>setSpeed(+e.target.value)} style={{...bs,fontSize:9,padding:'2px 4px'}} title="Faster pace shortens gaps and speeds up speech"><option value={.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option><option value={3}>3×</option><option value={4}>4×</option></select></div>
        <div style={{flex:1,margin:'0 8px'}}><div style={{height:3,background:'#1A1410',borderRadius:2}}><div style={{height:3,borderRadius:2,background:'#D4A017',width:`${SCRIPT.length?(bi/SCRIPT.length)*100:0}%`,transition:'width .3s'}}/></div><div style={{color:'#5A4D3C',fontSize:7,textAlign:'center',marginTop:1}}>{bi+1}/{SCRIPT.length}</div></div>
        <div style={{display:'flex',gap:3}}><button onClick={()=>setShH(h=>!h)} style={{...bs,background:shH?'#3A2A10':'#1A1410',color:shH?'#D4A017':'#5A4D3C',fontSize:9}}>עב</button><button onClick={()=>setShE(e=>!e)} style={{...bs,background:shE?'#3A2A10':'#1A1410',color:shE?'#D4A017':'#5A4D3C',fontSize:9}}>EN</button><button onClick={()=>{setAudOn(a=>{const on=!a;if(on)unlockWebAudio();return on});engRef.current?.stop()}} style={{...bs,color:audOn?'#D4A017':'#5A4D3C'}} title="Sound">{audOn?'🔊':'🔇'}</button></div>
      </div>
      {done&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.92)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}><div style={{textAlign:'center'}}><div style={{fontSize:56,marginBottom:12}}>🕯️✡️🕯️</div><h2 style={{color:'#D4A017',fontSize:26,fontWeight:200}}>לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם</h2><p style={{color:'#FAF0E6',fontSize:15}}>Next Year in Jerusalem</p><p style={{color:'#8B7355',fontSize:12,margin:'4px 0 16px'}}>Chag Pesach Sameach!</p><button onClick={()=>window.location.reload()} style={{background:'linear-gradient(135deg,#8B1A1A,#4A0A0A)',color:'#FAF0E6',border:'none',borderRadius:10,padding:'10px 28px',fontSize:14,cursor:'pointer'}}>Watch Again</button></div></div>}
    </div>
  );
}

const bs:React.CSSProperties={background:'#2A2118',border:'1px solid #3D3428',color:'#8B7355',borderRadius:5,padding:'3px 8px',cursor:'pointer',fontSize:11,fontFamily:"'Crimson Pro',serif"};
