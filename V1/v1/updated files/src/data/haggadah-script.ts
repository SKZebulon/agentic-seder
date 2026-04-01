// The Seder script — a mix of fixed liturgy and AI reaction slots
// The Director processes each beat sequentially

export type BeatType = 'phase' | 'liturgy' | 'action' | 'reaction';

export interface Beat {
  type: BeatType;
  phase?: string;
  speaker?: string | null;
  action?: string;
  he?: string;
  en?: string;
  dur?: number;
  // For reaction slots — AI generates dialogue
  context?: string;
  characters?: string[];
  maxReactions?: number;
}

export function buildScript(tradition: 'ashkenazi' | 'sephardi'): Beat[] {
  const isSeph = tradition === 'sephardi';

  return [
    // ── PRE-SEDER — All AI-generated reactions ──
    { type: 'reaction', context: 'Everyone is arriving and sitting down at the beautifully set Seder table. Kids are excited and restless. The non-Jewish guest is looking around nervously. Grandmother is inspecting the table settings.', characters: ['mother', 'child_young', 'child_wicked', 'guest', 'saba', 'savta'], maxReactions: 4 },

    // ── KADESH ──
    { type: 'phase', phase: 'קַדֵּשׁ · Kadesh — Sanctification', dur: 3500 },
    { type: 'action', speaker: 'leader', action: 'stand', dur: 800 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.', en: 'Blessed are You, Lord our God, King of the universe, who creates the fruit of the vine.', dur: 7000 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר בָּחַר בָּנוּ מִכָּל עָם, וְרוֹמְמָנוּ מִכָּל לָשׁוֹן, וְקִדְּשָׁנוּ בְּמִצְוֹתָיו.', en: 'Blessed are You, Lord our God, King of the universe, who has chosen us from all peoples, exalted us above all tongues, and sanctified us with His commandments.', dur: 11000 },
    { type: 'liturgy', speaker: 'leader', he: 'וַתִּתֶּן לָנוּ ה׳ אֱלֹהֵינוּ בְּאַהֲבָה מוֹעֲדִים לְשִׂמְחָה, חַגִּים וּזְמַנִּים לְשָׂשׂוֹן, אֶת יוֹם חַג הַמַּצּוֹת הַזֶּה, זְמַן חֵרוּתֵנוּ, מִקְרָא קֹדֶשׁ, זֵכֶר לִיצִיאַת מִצְרָיִם.', en: 'And You gave us, Lord our God, in love, festivals for rejoicing, holidays and times for gladness — this Festival of Matzot, the season of our freedom, a holy convocation, in remembrance of the Exodus from Egypt.', dur: 13000 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳, מְקַדֵּשׁ יִשְׂרָאֵל וְהַזְּמַנִּים.', en: 'Blessed are You, Lord, who sanctifies Israel and the festive seasons.', dur: 5000 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהֶחֱיָנוּ וְקִיְּמָנוּ וְהִגִּיעָנוּ לַזְּמַן הַזֶּה.', en: 'Blessed are You, Lord our God, King of the universe, who has kept us alive, sustained us, and brought us to this season.', dur: 7000 },
    { type: 'action', speaker: 'all', action: 'drink', he: 'שותים את הכוס הראשונה 🍷', en: 'Everyone drinks the first cup of wine, leaning to the left!', dur: 4000 },
    { type: 'action', speaker: 'leader', action: 'sit', dur: 600 },
    { type: 'reaction', context: 'Everyone just drank the first cup of wine. It is strong wine.', characters: ['uncle', 'guest', 'savta', 'child_wicked'], maxReactions: 2 },

    // ── URCHATZ ──
    { type: 'phase', phase: 'וּרְחַץ · Urchatz — Washing Without Blessing', dur: 3000 },
    { type: 'liturgy', speaker: 'leader', he: 'נוטלים ידיים ללא ברכה.', en: 'We wash our hands without saying a blessing.', dur: 3500 },
    { type: 'reaction', context: 'The leader just washed hands WITHOUT saying a blessing. This is unusual and is designed to make people ask why.', characters: ['guest', 'child_simple', 'child_wise', 'child_wicked'], maxReactions: 2 },

    // ── KARPAS ──
    { type: 'phase', phase: 'כַּרְפַּס · Karpas — The Green Vegetable', dur: 3000 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הָאֲדָמָה.', en: 'Blessed are You, Lord our God, King of the universe, who creates the fruit of the earth.', dur: 6000 },
    { type: 'action', speaker: 'all', action: 'eat', he: 'טובלים כרפס במי מלח.', en: 'Everyone dips parsley in salt water and eats — spring meets the tears of slavery.', dur: 3500 },
    { type: 'reaction', context: 'Everyone just ate parsley dipped in salt water. It is very salty. The salt water represents the tears of slaves.', characters: ['child_young', 'guest', 'mother'], maxReactions: 2 },

    // ── YACHATZ ──
    { type: 'phase', phase: 'יַחַץ · Yachatz — Breaking the Matzah', dur: 3000 },
    { type: 'action', speaker: 'leader', action: 'stand', dur: 800 },
    { type: 'action', speaker: 'leader', action: 'break_matzah', he: 'שוברים את המצה האמצעית.', en: 'The leader breaks the middle matzah. The larger piece becomes the Afikoman.', dur: 4000 },
    { type: 'liturgy', speaker: 'leader', he: 'הָא לַחְמָא עַנְיָא דִי אֲכָלוּ אַבְהָתָנָא בְּאַרְעָא דְמִצְרָיִם. כָּל דִכְפִין יֵיתֵי וְיֵכוֹל, כָּל דִצְרִיךְ יֵיתֵי וְיִפְסַח.', en: 'This is the bread of affliction that our ancestors ate in the land of Egypt. All who are hungry — come and eat. All who are in need — come and celebrate Passover.', dur: 10000 },
    { type: 'liturgy', speaker: 'leader', he: 'הָשַׁתָּא הָכָא, לְשָׁנָה הַבָּאָה בְּאַרְעָא דְיִשְׂרָאֵל. הָשַׁתָּא עַבְדֵי, לְשָׁנָה הַבָּאָה בְּנֵי חוֹרִין.', en: 'Now we are here — next year in the Land of Israel. Now we are slaves — next year we shall be free.', dur: 8000 },
    { type: 'action', speaker: 'leader', action: 'sit', dur: 600 },
    { type: 'reaction', context: 'The father just hid the Afikoman somewhere. The kids are trying to watch where he puts it. The youngest daughter claims she saw where it went.', characters: ['child_young', 'father', 'child_simple'], maxReactions: 2 },

    // ── MAGGID ──
    { type: 'phase', phase: 'מַגִּיד · Maggid — The Heart of the Seder', dur: 4000 },
    // Ma Nishtana
    { type: 'reaction', context: 'It is time for the youngest child to sing the Ma Nishtana (Four Questions). Everyone is looking at Noa expectantly. She has been practicing for weeks.', characters: ['mother', 'child_young'], maxReactions: 1 },
    { type: 'action', speaker: 'child_young', action: 'stand', dur: 1000 },
    { type: 'liturgy', speaker: 'child_young', he: 'מַה נִּשְׁתַּנָּה הַלַּיְלָה הַזֶּה מִכָּל הַלֵּילוֹת?', en: 'Why is this night different from all other nights?', dur: 6000 },
    { type: 'liturgy', speaker: 'child_young', he: 'שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין חָמֵץ וּמַצָּה, הַלַּיְלָה הַזֶּה כֻּלּוֹ מַצָּה.', en: 'On all other nights we eat bread or matzah — why tonight only matzah?', dur: 7000 },
    { type: 'liturgy', speaker: 'child_young', he: 'שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין שְׁאָר יְרָקוֹת, הַלַּיְלָה הַזֶּה מָרוֹר.', en: 'On all other nights we eat all vegetables — why tonight bitter herbs?', dur: 7000 },
    { type: 'liturgy', speaker: 'child_young', he: 'שֶׁבְּכָל הַלֵּילוֹת אֵין אָנוּ מַטְבִּילִין אֲפִילוּ פַּעַם אֶחָת, הַלַּיְלָה הַזֶּה שְׁתֵּי פְעָמִים.', en: 'On all other nights we do not dip even once — why tonight do we dip twice?', dur: 7000 },
    { type: 'liturgy', speaker: 'child_young', he: 'שֶׁבְּכָל הַלֵּילוֹת אָנוּ אוֹכְלִין בֵּין יוֹשְׁבִין וּבֵין מְסֻבִּין, הַלַּיְלָה הַזֶּה כֻּלָּנוּ מְסֻבִּין.', en: 'On all other nights we eat sitting or reclining — why tonight do we all recline?', dur: 7000 },
    { type: 'action', speaker: 'child_young', action: 'sit', dur: 800 },
    { type: 'reaction', context: 'Noa (age 8) just finished singing all four questions of the Ma Nishtana beautifully. The whole table is proud.', characters: ['savta', 'saba', 'mother', 'child_wicked', 'guest'], maxReactions: 3 },

    // Avadim Hayinu
    { type: 'liturgy', speaker: 'leader', he: 'עֲבָדִים הָיִינוּ לְפַרְעֹה בְּמִצְרָיִם, וַיּוֹצִיאֵנוּ ה׳ אֱלֹהֵינוּ מִשָּׁם בְּיָד חֲזָקָה וּבִזְרוֹעַ נְטוּיָה. וְאִלּוּ לֹא הוֹצִיא הַקָּדוֹשׁ בָּרוּךְ הוּא אֶת אֲבוֹתֵינוּ מִמִּצְרַיִם, הֲרֵי אָנוּ וּבָנֵינוּ וּבְנֵי בָנֵינוּ, מְשֻׁעְבָּדִים הָיִינוּ לְפַרְעֹה בְּמִצְרָיִם.', en: 'We were slaves to Pharaoh in Egypt, and the Lord our God brought us out from there with a strong hand and an outstretched arm. Had the Holy One not brought our ancestors out of Egypt, then we, our children, and our children\'s children would still be enslaved.', dur: 12000 },
    { type: 'reaction', context: 'The leader just said "We were slaves in Egypt." This is a heavy moment. The rebellious teen might have a sarcastic take, but it is also genuinely moving.', characters: ['child_wicked', 'savta'], maxReactions: 1 },

    // Four Children
    { type: 'liturgy', speaker: 'leader', he: 'כְּנֶגֶד אַרְבָּעָה בָנִים דִּבְּרָה תוֹרָה. אֶחָד חָכָם, וְאֶחָד רָשָׁע, וְאֶחָד תָּם, וְאֶחָד שֶׁאֵינוֹ יוֹדֵעַ לִשְׁאוֹל.', en: 'The Torah speaks of four children: one wise, one rebellious, one simple, and one who does not know how to ask.', dur: 9000 },
    { type: 'action', speaker: 'child_wise', action: 'stand', dur: 800 },
    { type: 'liturgy', speaker: 'child_wise', he: 'חָכָם מָה הוּא אוֹמֵר? מָה הָעֵדוֹת וְהַחֻקִּים וְהַמִּשְׁפָּטִים אֲשֶׁר צִוָּה ה׳ אֱלֹהֵינוּ אֶתְכֶם?', en: 'The Wise Child asks: What are the laws, statutes and ordinances which the Lord our God has commanded you?', dur: 7000 },
    { type: 'liturgy', speaker: 'leader', he: 'וְאַף אַתָּה אֱמוֹר לוֹ כְּהִלְכוֹת הַפֶּסַח: אֵין מַפְטִירִין אַחַר הַפֶּסַח אֲפִיקוֹמָן.', en: 'Teach the wise child all the laws of Passover, down to the very last detail.', dur: 6000 },
    { type: 'action', speaker: 'child_wise', action: 'sit', dur: 600 },
    { type: 'action', speaker: 'child_wicked', action: 'stand', dur: 800 },
    { type: 'liturgy', speaker: 'child_wicked', he: 'רָשָׁע מָה הוּא אוֹמֵר? מָה הָעֲבוֹדָה הַזֹּאת לָכֶם? לָכֶם — וְלֹא לוֹ.', en: 'The Rebellious Child says: What does this service mean to YOU? To you — not to them.', dur: 7000 },
    { type: 'liturgy', speaker: 'leader', he: 'הַקְהֵה אֶת שִׁנָּיו. בַּעֲבוּר זֶה עָשָׂה ה׳ לִי — לִי וְלֹא לוֹ.', en: 'Set their teeth on edge. It is because of what God did for ME — for me, not for you.', dur: 6000 },
    { type: 'action', speaker: 'child_wicked', action: 'sit', dur: 600 },
    { type: 'reaction', context: 'The rebellious child (Dani, 15) was just told the Haggadah says he would not have been redeemed. The aunt (new to family) is watching this exchange with fascination.', characters: ['child_wicked', 'aunt', 'child_wise'], maxReactions: 2 },
    { type: 'liturgy', speaker: 'child_simple', he: 'תָּם מָה הוּא אוֹמֵר? מַה זֹּאת?', en: 'The Simple Child asks: What is this?', dur: 4000 },
    { type: 'liturgy', speaker: 'leader', he: 'בְּחֹזֶק יָד הוֹצִיאָנוּ ה׳ מִמִּצְרַיִם, מִבֵּית עֲבָדִים.', en: 'With a strong hand God brought us out of Egypt, from the house of bondage.', dur: 5000 },
    { type: 'liturgy', speaker: 'leader', he: 'וְשֶׁאֵינוֹ יוֹדֵעַ לִשְׁאוֹל — אַתְּ פְּתַח לוֹ.', en: 'And for the child who does not know how to ask — you must open for them.', dur: 5000 },

    // V'hi She'amda
    { type: 'liturgy', speaker: 'leader', he: 'וְהִיא שֶׁעָמְדָה לַאֲבוֹתֵינוּ וְלָנוּ. שֶׁלֹּא אֶחָד בִּלְבָד עָמַד עָלֵינוּ לְכַלּוֹתֵנוּ, אֶלָּא שֶׁבְּכָל דּוֹר וָדוֹר עוֹמְדִים עָלֵינוּ לְכַלּוֹתֵנוּ, וְהַקָּדוֹשׁ בָּרוּךְ הוּא מַצִּילֵנוּ מִיָּדָם.', en: 'And this promise has sustained our ancestors and us. For not just one enemy has risen against us to destroy us, but in every generation they rise against us — and the Holy One saves us from their hand.', dur: 13000 },
    { type: 'reaction', context: 'This is V\'hi She\'amda — one of the most emotional moments of the Seder. "In every generation they rise against us to destroy us." The grandmother is thinking of the Holocaust. This hits deep.', characters: ['savta', 'guest', 'saba'], maxReactions: 2 },

    // Ten Plagues
    { type: 'liturgy', speaker: 'leader', he: 'עֶשֶׂר מַכּוֹת שֶׁהֵבִיא הַקָּדוֹשׁ בָּרוּךְ הוּא עַל הַמִּצְרִים:', en: 'These are the ten plagues the Holy One brought upon Egypt. For each, we spill a drop of wine:', dur: 6000 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'דָּם!', en: 'Blood!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'צְפַרְדֵּעַ!', en: 'Frogs!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'כִּנִּים!', en: 'Lice!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'עָרוֹב!', en: 'Wild Beasts!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'דֶּבֶר!', en: 'Pestilence!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'שְׁחִין!', en: 'Boils!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'בָּרָד!', en: 'Hail!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'אַרְבֶּה!', en: 'Locusts!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'חֹשֶׁךְ!', en: 'Darkness!', dur: 2200 },
    { type: 'action', speaker: 'all', action: 'spill', he: 'מַכַּת בְּכוֹרוֹת!', en: 'Death of the Firstborn!', dur: 3000 },
    { type: 'reaction', context: 'We just finished listing all ten plagues while spilling drops of wine. The leader explains we diminish our joy because others suffered. This is a powerful moral teaching.', characters: ['guest', 'child_wicked', 'leader', 'child_simple'], maxReactions: 2 },

    // Dayenu
    { type: 'liturgy', speaker: 'leader', he: 'כַּמָּה מַעֲלוֹת טוֹבוֹת לַמָּקוֹם עָלֵינוּ!', en: 'How many levels of goodness has God bestowed upon us!', dur: 4000 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'אִלּוּ הוֹצִיאָנוּ מִמִּצְרַיִם — דַּיֵּנוּ!', en: 'Had He brought us out of Egypt — DAYENU! It would have been enough!', dur: 5000 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'אִלּוּ נָתַן לָנוּ אֶת הַשַׁבָּת — דַּיֵּנוּ!', en: 'Had He given us the Shabbat — DAYENU!', dur: 4000 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'אִלּוּ נָתַן לָנוּ אֶת הַתּוֹרָה — דַּיֵּנוּ!', en: 'Had He given us the Torah — DAYENU!', dur: 4000 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'אִלּוּ הִכְנִיסָנוּ לְאֶרֶץ יִשְׂרָאֵל — דַּיֵּנוּ!', en: 'Had He brought us into the Land of Israel — DAYENU!', dur: 4000 },
    { type: 'action', speaker: 'all', action: 'celebrate', he: 'דַּיֵּנוּ! דַּיֵּנוּ! דַּיֵּנוּ!', en: 'DAYENU! DAYENU! DAYENU!', dur: 3500 },
    { type: 'reaction', context: 'Everyone just sang Dayenu with great energy. Uncle Moshe was by far the loudest. The rebellious teen (who has been eye-rolling all evening) was caught singing along. The guest is clapping.', characters: ['uncle', 'child_wicked', 'guest', 'mother'], maxReactions: 2 },

    // Second Cup
    { type: 'action', speaker: 'all', action: 'drink', he: '🍷 כוס שנייה!', en: 'Everyone drinks the second cup of wine!', dur: 3500 },

    // ── RACHTZAH ──
    { type: 'phase', phase: 'רָחְצָה · Rachtzah — Washing With Blessing', dur: 2500 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו, וְצִוָּנוּ עַל נְטִילַת יָדָיִם.', en: 'Blessed are You, Lord our God, who sanctified us with His commandments, and commanded us concerning the washing of hands.', dur: 7000 },

    // ── MOTZI MATZAH ──
    { type: 'phase', phase: 'מוֹצִיא מַצָּה · Motzi Matzah', dur: 2500 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ.', en: 'Blessed are You, Lord our God, who brings forth bread from the earth.', dur: 6000 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל אֲכִילַת מַצָּה.', en: 'Blessed are You, Lord, who commanded us concerning the eating of matzah.', dur: 5000 },
    { type: 'action', speaker: 'all', action: 'eat', he: 'אוכלים מצה בהסיבה.', en: 'Everyone eats matzah while leaning to the left!', dur: 3500 },
    { type: 'reaction', context: 'Everyone is eating dry matzah. The grandfather is complaining it is dry. The grandmother thinks hers was better.', characters: ['saba', 'savta', 'child_wicked'], maxReactions: 2 },

    // ── MAROR ──
    { type: 'phase', phase: 'מָרוֹר · Maror — Bitter Herb', dur: 2500 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְצִוָּנוּ עַל אֲכִילַת מָרוֹר.', en: 'Blessed are You, Lord, who commanded us concerning the eating of bitter herbs.', dur: 6000 },
    { type: 'action', speaker: 'all', action: 'eat', he: 'אוכלים מרור בחרוסת.', en: 'Everyone eats bitter herb dipped in charoset.', dur: 3000 },
    { type: 'reaction', context: 'Everyone just ate raw horseradish (maror). It is VERY spicy. Eyes are watering. The non-Jewish guest was not prepared for this. The grandfather ate it without flinching.', characters: ['child_young', 'guest', 'saba', 'uncle', 'savta'], maxReactions: 3 },

    // ── KORECH ──
    { type: 'phase', phase: 'כּוֹרֵךְ · Korech — Hillel\'s Sandwich', dur: 2500 },
    { type: 'liturgy', speaker: 'leader', he: 'זֵכֶר לְמִקְדָּשׁ כְּהִלֵּל. כָּרַךְ מַצָּה וּמָרוֹר וְאָכַל בְּיַחַד.', en: 'In remembrance of the Temple as Hillel did: he wrapped matzah and bitter herbs and ate them together.', dur: 7000 },
    { type: 'action', speaker: 'all', action: 'eat', dur: 3000 },
    { type: 'reaction', context: 'Everyone is eating the Hillel sandwich (matzah + bitter herb + charoset). Hillel invented the sandwich concept 2000 years before the Earl of Sandwich.', characters: ['child_wicked', 'child_wise', 'guest'], maxReactions: 1 },

    // ── SHULCHAN ORECH — THE MEAL ──
    { type: 'phase', phase: 'שֻׁלְחָן עוֹרֵךְ · Shulchan Orech — THE MEAL!', dur: 3500 },
    { type: 'reaction', context: 'THE MEAL IS FINALLY BEING SERVED! The kids have been waiting for hours. The grandmother is already serving soup. Everyone is excited to eat real food.', characters: ['child_young', 'child_simple', 'savta', 'uncle'], maxReactions: 3 },
    { type: 'action', speaker: 'all', action: 'eat_meal', he: 'הסעודה החגיגית!', en: 'The festive meal!', dur: 6000 },
    { type: 'reaction', context: `During the meal. The grandmother is pushing food on everyone. The grandfather has fallen asleep in his chair. ${isSeph ? "Uncle Moshe is reminiscing about Seder in Morocco." : "Someone wants more matzah ball soup."}`, characters: ['savta', 'saba', 'uncle', 'child_wicked', 'mother', 'father'], maxReactions: 3 },
    { type: 'reaction', context: 'The grandfather (Saba Yosef) has been sleeping for a few minutes. The rebellious teen is considering pranking him. The father is telling a long story nobody asked for.', characters: ['saba', 'child_wicked', 'father', 'aunt'], maxReactions: 2 },

    // ── TZAFUN — AFIKOMAN ──
    { type: 'phase', phase: 'צָפוּן · Tzafun — Finding the Afikoman!', dur: 3000 },
    { type: 'reaction', context: 'It is time to find the Afikoman! The father hid it earlier. The children are about to search. Noa (8) is VERY competitive about this. Eli (6) never finds it. This is a big deal for the kids.', characters: ['father', 'child_young', 'child_simple'], maxReactions: 3 },
    { type: 'reaction', context: 'Noa found the Afikoman! She is now negotiating her prize with the father. She always starts by asking for something ridiculous then settles for ice cream. The other kids are jealous.', characters: ['child_young', 'father', 'mother', 'child_simple', 'child_wicked'], maxReactions: 3 },
    { type: 'action', speaker: 'all', action: 'eat', he: 'כולם אוכלים את האפיקומן.', en: 'Everyone eats a piece of the Afikoman — the last food of the night.', dur: 3500 },

    // ── BARECH ──
    { type: 'phase', phase: 'בָּרֵךְ · Barech — Grace and Elijah\'s Cup', dur: 3000 },
    { type: 'liturgy', speaker: 'leader', he: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַזָּן אֶת הָעוֹלָם כֻּלּוֹ בְּטוּבוֹ, בְּחֵן בְּחֶסֶד וּבְרַחֲמִים.', en: 'Blessed are You, Lord our God, who sustains the entire world with goodness, grace, kindness and compassion.', dur: 8000 },
    { type: 'action', speaker: 'all', action: 'drink', he: '🍷 כוס שלישית!', en: 'The third cup!', dur: 3500 },

    // Elijah
    { type: 'action', speaker: 'leader', action: 'stand', dur: 800 },
    { type: 'liturgy', speaker: 'leader', he: 'פותחים את הדלת לאליהו הנביא!', en: 'Open the door for Elijah the Prophet!', dur: 3500 },
    { type: 'action', speaker: null, action: 'door', he: '...', en: 'The door opens. A warm wind. The candles flicker. Elijah\'s cup trembles...', dur: 6000 },
    { type: 'reaction', context: 'The door has been opened for Elijah the Prophet. The candles flickered. Everyone is watching the special golden cup of wine set for Elijah to see if it moves. This is a magical moment, especially for the children.', characters: ['child_simple', 'savta', 'guest', 'child_young'], maxReactions: 2 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'אֵלִיָּהוּ הַנָּבִיא, אֵלִיָּהוּ הַתִּשְׁבִּי, אֵלִיָּהוּ הַגִּלְעָדִי, בִּמְהֵרָה בְיָמֵינוּ יָבוֹא אֵלֵינוּ, עִם מָשִׁיחַ בֶּן דָּוִד.', en: 'Elijah the Prophet, Elijah the Tishbite, Elijah of Gilead — may he come speedily in our days, with the Messiah son of David.', dur: 10000 },
    { type: 'action', speaker: 'leader', action: 'sit', dur: 600 },

    // ── HALLEL ──
    { type: 'phase', phase: 'הַלֵּל · Hallel — Songs of Praise!', dur: 3000 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'הוֹדוּ לַה׳ כִּי טוֹב, כִּי לְעוֹלָם חַסְדּוֹ!', en: 'Give thanks to the Lord for He is good, for His kindness endures forever!', dur: 5000 },
    { type: 'action', speaker: 'all', action: 'drink', he: '🍷 כוס רביעית!', en: 'The fourth and final cup!', dur: 3500 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'חַד גַּדְיָא, חַד גַּדְיָא, דְּזַבִּין אַבָּא בִּתְרֵי זוּזֵי! חַד גַּדְיָא, חַד גַּדְיָא!', en: 'One little goat, one little goat, that father bought for two zuzim! One little goat, one little goat!', dur: 6000 },
    { type: 'reaction', context: 'Everyone is singing Chad Gadya. Uncle Moshe is banging on the table. It is chaotic and joyful. Even the rebellious teen is singing. The non-Jewish guest is trying to sing along phonetically.', characters: ['uncle', 'child_wicked', 'guest', 'child_young'], maxReactions: 2 },

    // ── NIRTZAH ──
    { type: 'phase', phase: 'נִרְצָה · Nirtzah — Next Year in Jerusalem!', dur: 4000 },
    { type: 'action', speaker: 'leader', action: 'stand', dur: 800 },
    { type: 'liturgy', speaker: 'leader', he: 'חֲסַל סִדּוּר פֶּסַח כְּהִלְכָתוֹ, כְּכָל מִשְׁפָּטוֹ וְחֻקָּתוֹ. כַּאֲשֶׁר זָכִינוּ לְסַדֵּר אוֹתוֹ, כֵּן נִזְכֶּה לַעֲשׂוֹתוֹ.', en: 'The Seder is now complete, according to all its laws and customs. As we have merited to perform it, so may we merit to do it again.', dur: 10000 },
    { type: 'action', speaker: 'all', action: 'stand', dur: 1500 },
    { type: 'action', speaker: 'all', action: 'sing', he: 'לְשָׁנָה הַבָּאָה בִּירוּשָׁלָיִם!', en: 'NEXT YEAR IN JERUSALEM!', dur: 6000 },
    { type: 'action', speaker: 'all', action: 'celebrate', he: 'חג פסח שמח!', en: 'Chag Pesach Sameach! Happy Passover!', dur: 5000 },
    { type: 'reaction', context: 'The Seder is over! Everyone is hugging, laughing, exhausted. The youngest wants her Afikoman prize. The grandfather claims it went by fast. The grandmother is already talking about next year. The non-Jewish guest is deeply moved.', characters: ['child_young', 'saba', 'savta', 'guest', 'mother', 'child_wicked'], maxReactions: 3 },

    // End
    { type: 'action', speaker: null, action: 'end', dur: 0 },
  ];
}
