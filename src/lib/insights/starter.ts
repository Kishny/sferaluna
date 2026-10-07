// src/lib/insights/starter.ts

/**
 * Série de départ de la connaissance du jour.
 *
 * Chaque entrée a été vérifiée le 7 octobre 2026 ; `source` indique la page
 * consultée (note interne, jamais montrée aux membres). L'ordre alterne les
 * catégories : c'est l'ordre dans lequel elles seront proposées.
 *
 * Rien n'est publié tant qu'une administratrice n'a pas importé la série
 * depuis l'onglet « Connaissance du jour » de l'administration.
 */

import type { InsightCategory } from "@/models/DailyInsight";

export interface StarterInsight {
  slug: string;
  category: InsightCategory;
  title: string;
  text: string;
  source: string;
}

export const STARTER_INSIGHTS: StarterInsight[] = [
  {
    "slug": "hexade",
    "category": "mot",
    "title": "Hexade",
    "text": "Nom féminin. Du grec hexás, « le nombre six », « groupe de six ». Les pythagoriciens associaient le six à l’harmonie et au mariage, c’est-à-dire à l’union. C’est le nom que SferaLuna donne à vos six proches de confiance, dans l’application.",
    "source": "https://lsj.gr/wiki/ἑξάς"
  },
  {
    "slug": "kwolek-kevlar",
    "category": "femme",
    "title": "Stephanie Kwolek",
    "text": "En 1965, cette chimiste américaine découvre une fibre cinq fois plus résistante que l’acier à poids égal : le Kevlar, utilisé depuis dans les gilets pare-balles.",
    "source": "https://www.sciencehistory.org/education/scientific-biographies/stephanie-l-kwolek/"
  },
  {
    "slug": "pink-star",
    "category": "monde",
    "title": "Le Pink Star",
    "text": "Ce diamant rose de 59,60 carats a été vendu 71,2 millions de dollars à Hong Kong en avril 2017. Aucune pierre précieuse n’avait jamais atteint un tel prix aux enchères.",
    "source": "https://www.sothebys.com/en/articles/the-five-most-expensive-pink-diamonds"
  },
  {
    "slug": "ocytocine",
    "category": "amour",
    "title": "L’hormone du lien",
    "text": "Un câlin, une main tenue : ces gestes font libérer de l’ocytocine, une hormone associée à l’attachement et au sentiment de confiance.",
    "source": "https://www.health.harvard.edu/mind-and-mood/oxytocin-the-love-hormone"
  },
  {
    "slug": "limerence",
    "category": "sentiment",
    "title": "Limérence",
    "text": "L’état d’une personne entièrement absorbée par un sentiment amoureux, entre euphorie et besoin d’être aimée en retour. Le mot a été forgé par la psychologue américaine Dorothy Tennov, qui l’a fait connaître en 1979 dans son livre Love and Limerence.",
    "source": "https://en.wikipedia.org/wiki/Limerence"
  },
  {
    "slug": "serendipite",
    "category": "mot",
    "title": "Sérendipité",
    "text": "Le fait de trouver par hasard ce que l’on ne cherchait pas. Le mot vient de l’anglais serendipity, inventé en 1754 par l’écrivain Horace Walpole d’après un conte, Les Trois Princes de Serendip.",
    "source": "https://fr.wikipedia.org/wiki/S%C3%A9rendipit%C3%A9"
  },
  {
    "slug": "ada-lovelace",
    "category": "femme",
    "title": "Ada Lovelace",
    "text": "En 1843, cette mathématicienne anglaise publie ce qui est souvent considéré comme le premier programme informatique, écrit pour une machine, la machine analytique de Charles Babbage, qui n’a jamais été construite.",
    "source": "https://en.wikipedia.org/wiki/Note_G"
  },
  {
    "slug": "lune-s-eloigne",
    "category": "monde",
    "title": "La Lune s’éloigne",
    "text": "Chaque année, la Lune s’écarte de la Terre d’environ 3,8 centimètres. On le mesure grâce à des réflecteurs laissés à sa surface par les missions Apollo.",
    "source": "https://www.jpl.nasa.gov/news/the-apollo-experiment-that-keeps-on-giving/"
  },
  {
    "slug": "vena-amoris",
    "category": "amour",
    "title": "Pourquoi l’annulaire ?",
    "text": "Dans de nombreux pays, on porte l’alliance à l’annulaire gauche. La tradition l’explique par une croyance ancienne : une veine, la vena amoris, relierait ce doigt directement au cœur. L’anatomie a montré qu’elle n’existe pas.",
    "source": "https://en.wikipedia.org/wiki/Vena_amoris"
  },
  {
    "slug": "saudade",
    "category": "sentiment",
    "title": "Saudade",
    "text": "Mot portugais : une mélancolie douce, mêlée de tendresse, que l’on ressent en pensant à une personne, un lieu ou un moment qui nous manque.",
    "source": "https://en.wikipedia.org/wiki/Saudade"
  },
  {
    "slug": "petrichor",
    "category": "mot",
    "title": "Pétrichor",
    "text": "L’odeur de la terre après la pluie. Le mot a été créé en 1964 par deux scientifiques australiens, Isabel Joy Bear et Richard Thomas, à partir du grec petra, « pierre », et ichor, le sang des dieux.",
    "source": "https://en.wikipedia.org/wiki/Petrichor"
  },
  {
    "slug": "marie-curie",
    "category": "femme",
    "title": "Marie Curie",
    "text": "Première femme à recevoir un prix Nobel, en 1903. Elle reste la seule personne récompensée dans deux sciences différentes : la physique, puis la chimie en 1911.",
    "source": "https://www.nobelprize.org/prizes/facts/nobel-prize-facts/"
  },
  {
    "slug": "jour-venus",
    "category": "monde",
    "title": "Un jour sur Vénus",
    "text": "Vénus tourne si lentement sur elle-même qu’il lui faut 243 jours terrestres pour faire un tour, alors qu’elle boucle son orbite autour du Soleil en 225 jours. Son jour est plus long que son année.",
    "source": "https://science.nasa.gov/venus/venus-facts/"
  },
  {
    "slug": "amours-grecs",
    "category": "amour",
    "title": "Quatre mots pour aimer",
    "text": "Les Grecs anciens ne se contentaient pas d’un seul mot : éros pour le désir, philia pour l’amitié, storgê pour la tendresse familiale, agapè pour l’amour désintéressé.",
    "source": "https://en.wikipedia.org/wiki/Greek_words_for_love"
  },
  {
    "slug": "hiraeth",
    "category": "sentiment",
    "title": "Hiraeth",
    "text": "Mot gallois : un mélange de nostalgie, de mal du pays et de chagrin pour ce qui est perdu, un lieu, un temps ou une personne que l’on ne peut plus retrouver.",
    "source": "https://welearnwelsh.com/?p=2948"
  },
  {
    "slug": "komorebi",
    "category": "mot",
    "title": "Komorebi",
    "text": "Mot japonais qui désigne la lumière du soleil filtrant à travers les feuilles des arbres. Le français n’a pas de mot unique pour le dire.",
    "source": "https://jisho.org/word/%E6%9C%A8%E6%BC%8F%E3%82%8C%E6%97%A5"
  },
  {
    "slug": "hedy-lamarr",
    "category": "femme",
    "title": "Hedy Lamarr",
    "text": "Star d’Hollywood le jour, inventrice la nuit. En 1942, elle brevète avec le compositeur George Antheil un système de communication par saut de fréquence, un principe que l’on retrouve aujourd’hui dans le Bluetooth.",
    "source": "https://en.wikipedia.org/wiki/Hedy_Lamarr"
  },
  {
    "slug": "pieuvre-trois-coeurs",
    "category": "monde",
    "title": "Trois cœurs",
    "text": "La pieuvre possède trois cœurs : deux envoient le sang vers les branchies, le troisième vers le reste du corps. Son sang est bleu.",
    "source": "https://www.nhm.ac.uk/discover/octopuses-keep-surprising-us-here-are-eight-examples-how.html"
  },
  {
    "slug": "poeme-sumerien",
    "category": "amour",
    "title": "Le plus vieux poème d’amour",
    "text": "Le plus ancien poème d’amour connu est souvent identifié à une tablette sumérienne vieille d’environ 4 000 ans, conservée à Istanbul. Écrit en cunéiforme dans l’argile, il s’adresse au roi Shu-Sin.",
    "source": "https://en.wikipedia.org/wiki/Istanbul_2461"
  },
  {
    "slug": "mamihlapinatapai",
    "category": "sentiment",
    "title": "Mamihlapinatapai",
    "text": "Mot yagan, une langue de la Terre de Feu : le regard qu’échangent deux personnes qui espèrent chacune que l’autre fera le premier pas. Il est souvent cité comme l’un des mots les plus difficiles à traduire au monde.",
    "source": "https://en.wikipedia.org/wiki/Mamihlapinatapai"
  },
  {
    "slug": "ataraxie",
    "category": "mot",
    "title": "Ataraxie",
    "text": "La tranquillité de l’âme, l’absence de trouble. Pour les épicuriens comme pour les sceptiques grecs, c’était la clé du bonheur ; les stoïciens y voyaient plutôt le fruit d’une vie vertueuse.",
    "source": "https://en.wikipedia.org/wiki/Ataraxia"
  },
  {
    "slug": "mary-anderson",
    "category": "femme",
    "title": "Mary Anderson",
    "text": "En 1903, cette Américaine fait breveter un bras muni d’une lame de caoutchouc, actionné depuis l’intérieur du véhicule : l’essuie-glace.",
    "source": "https://en.wikipedia.org/wiki/Mary_Anderson_(inventor)"
  },
  {
    "slug": "pleiades",
    "category": "monde",
    "title": "Les Pléiades",
    "text": "Cet amas d’étoiles est surnommé « les Sept Sœurs », mais la plupart des gens n’en distinguent que six à l’œil nu. Il en contient en réalité plus d’un millier.",
    "source": "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45/"
  },
  {
    "slug": "taj-mahal",
    "category": "amour",
    "title": "Le Taj Mahal",
    "text": "Ce mausolée de marbre blanc a été bâti au XVIIe siècle par l’empereur Shah Jahan en mémoire de son épouse Mumtaz Mahal. Sa construction a duré une vingtaine d’années.",
    "source": "https://whc.unesco.org/en/list/252/"
  },
  {
    "slug": "kintsugi",
    "category": "mot",
    "title": "Kintsugi",
    "text": "Art japonais qui consiste à réparer une céramique brisée avec de la laque saupoudrée d’or. La cassure n’est pas cachée : elle est mise en valeur et fait partie de l’histoire de l’objet.",
    "source": "https://en.wikipedia.org/wiki/Kintsugi"
  },
  {
    "slug": "josephine-cochrane",
    "category": "femme",
    "title": "Josephine Cochrane",
    "text": "Lassée de voir sa vaisselle ébréchée, cette Américaine conçoit un lave-vaisselle à pression d’eau, le premier à connaître un vrai succès commercial, et le fait breveter en 1886.",
    "source": "https://en.wikipedia.org/wiki/Josephine_Cochrane"
  },
  {
    "slug": "face-de-la-lune",
    "category": "monde",
    "title": "Toujours la même face",
    "text": "La Lune met exactement le même temps à tourner sur elle-même qu’à faire le tour de la Terre. C’est pourquoi elle nous montre toujours le même visage.",
    "source": "https://science.nasa.gov/moon/tidal-locking/"
  },
  {
    "slug": "manchots-galet",
    "category": "amour",
    "title": "Le galet des manchots",
    "text": "Les manchots papous bâtissent leur nid avec des galets, que les deux partenaires rapportent un à un. Le mâle « demandant en mariage » avec le plus beau galet ? Une jolie légende, que les scientifiques n’ont pas confirmée.",
    "source": "https://www.snopes.com/penguin-pebble-proposal/"
  },
  {
    "slug": "ubuntu",
    "category": "mot",
    "title": "Ubuntu",
    "text": "Mot des langues bantoues d’Afrique australe, souvent traduit par « je suis parce que nous sommes ». Il exprime l’idée que l’on ne devient pleinement soi qu’à travers les autres.",
    "source": "https://en.wikipedia.org/wiki/Ubuntu_philosophy"
  },
  {
    "slug": "terechkova",
    "category": "femme",
    "title": "Valentina Terechkova",
    "text": "Le 16 juin 1963, à 26 ans, cette cosmonaute soviétique devient la première femme à voyager dans l’espace, seule à bord de Vostok 6.",
    "source": "https://en.wikipedia.org/wiki/Valentina_Tereshkova"
  },
  {
    "slug": "diamant-graphite",
    "category": "monde",
    "title": "Diamant et mine de crayon",
    "text": "Le diamant et le graphite d’une mine de crayon sont faits du même élément, le carbone. Seule change la façon dont les atomes sont assemblés.",
    "source": "https://www.britannica.com/science/allotrope"
  },
  {
    "slug": "hippocampes",
    "category": "amour",
    "title": "La danse des hippocampes",
    "text": "Chez de nombreuses espèces d’hippocampes, les couples se retrouvent chaque matin pour une courte danse, queues entrelacées, avant de se séparer pour la journée. Et c’est le mâle qui porte les petits.",
    "source": "https://projectseahorse.org/saving-seahorses/about-seahorses/reproduction/"
  },
  {
    "slug": "meraki",
    "category": "mot",
    "title": "Meraki",
    "text": "Mot grec moderne, venu du turc : le soin, le goût et l’amour que l’on met dans ce que l’on fait, qu’il s’agisse de cuisiner un plat ou de dresser une table.",
    "source": "https://hellenisteukontos.opoudjis.net/2016-08-09-what-do-the-turkish-loanwords-merak-and-merakl%c4%b1-mean-in-your-language/"
  },
  {
    "slug": "junko-tabei",
    "category": "femme",
    "title": "Junko Tabei",
    "text": "Le 16 mai 1975, cette alpiniste japonaise devient la première femme à atteindre le sommet de l’Everest.",
    "source": "https://en.wikipedia.org/wiki/Junko_Tabei"
  },
  {
    "slug": "flocon",
    "category": "monde",
    "title": "Six branches",
    "text": "Les cristaux de neige sont bâtis sur une symétrie à six côtés : jamais cinq branches, jamais huit. Cette géométrie vient de la façon dont les molécules d’eau s’assemblent en gelant.",
    "source": "https://www.its.caltech.edu/~atomic/snowcrystals/faqs/faqs.htm"
  },
  {
    "slug": "wangari-maathai",
    "category": "femme",
    "title": "Wangari Maathai",
    "text": "Biologiste kényane, elle fonde en 1977 un mouvement qui a fait planter des dizaines de millions d’arbres. En 2004, elle devient la première Africaine à recevoir le prix Nobel de la paix.",
    "source": "https://www.nobelprize.org/prizes/peace/2004/maathai/facts/"
  },
  {
    "slug": "alveoles",
    "category": "monde",
    "title": "La forme parfaite",
    "text": "Les abeilles construisent des alvéoles à six côtés. Le mathématicien Thomas Hales a démontré en 1999 que l’hexagone est la forme qui découpe une surface en cellules de même aire avec le moins de paroi possible.",
    "source": "https://en.wikipedia.org/wiki/Honeycomb_theorem"
  },
  {
    "slug": "katherine-johnson",
    "category": "femme",
    "title": "Katherine Johnson",
    "text": "Mathématicienne à la NASA, elle a vérifié à la main les calculs de trajectoire du vol de John Glenn, premier Américain en orbite autour de la Terre, en 1962.",
    "source": "https://www.nasa.gov/centers-and-facilities/langley/katherine-johnson-biography/"
  },
  {
    "slug": "alice-guy",
    "category": "femme",
    "title": "Alice Guy",
    "text": "Vers 1896, cette Française tourne La Fée aux choux, souvent considéré comme l’un des tout premiers films de fiction, même si sa date exacte reste discutée. Elle est reconnue comme la première femme réalisatrice de l’histoire du cinéma.",
    "source": "https://www.britannica.com/biography/Alice-Guy-Blache"
  },
  {
    "slug": "olympe-de-gouges",
    "category": "femme",
    "title": "Olympe de Gouges",
    "text": "En 1791, elle rédige la Déclaration des droits de la femme et de la citoyenne, qui affirme que « la femme naît libre et demeure égale à l’homme en droits ».",
    "source": "https://www.laculturegenerale.com/declaration-droits-femme-olympe-gouges/"
  },
  {
    "slug": "sappho",
    "category": "femme",
    "title": "Sappho",
    "text": "Poétesse grecque de l’île de Lesbos, vers 600 avant notre ère. Ses vers célébraient l’amour entre femmes ; les mots « saphique » et « lesbienne » viennent de son nom et de celui de son île.",
    "source": "https://en.wikipedia.org/wiki/Sappho"
  },
  {
    "slug": "grace-hopper",
    "category": "femme",
    "title": "Grace Hopper",
    "text": "En 1952, cette informaticienne américaine met au point A-0, souvent présenté comme le premier compilateur : un programme qui traduit des instructions écrites par un humain en code compris par la machine.",
    "source": "https://en.wikipedia.org/wiki/A-0_System"
  },
  {
    "slug": "yourcenar",
    "category": "femme",
    "title": "Marguerite Yourcenar",
    "text": "En 1980, l’autrice des Mémoires d’Hadrien devient la première femme élue à l’Académie française, 345 ans après sa fondation.",
    "source": "https://www.academie-francaise.fr/les-immortels/marguerite-yourcenar"
  },
  {
    "slug": "bertha-benz",
    "category": "femme",
    "title": "Bertha Benz",
    "text": "En août 1888, sans prévenir son mari Carl Benz, elle prend le volant de l’automobile qu’il a inventée et parcourt une centaine de kilomètres, de Mannheim à Pforzheim : le premier long trajet en automobile de l’histoire.",
    "source": "https://en.wikipedia.org/wiki/Bertha_Benz"
  },
  {
    "slug": "nellie-bly",
    "category": "femme",
    "title": "Nellie Bly",
    "text": "Journaliste américaine, elle boucle en 1890 un tour du monde en 72 jours, seule, battant le record imaginaire du Phileas Fogg de Jules Verne.",
    "source": "https://en.wikipedia.org/wiki/Nellie_Bly"
  },
  {
    "slug": "jeanne-barret",
    "category": "femme",
    "title": "Jeanne Barret",
    "text": "Embarquée déguisée en homme dans l’expédition de Bougainville (1766-1769), comme assistante du botaniste Philibert Commerson, cette Française est la première femme connue à avoir fait le tour du monde.",
    "source": "https://en.wikipedia.org/wiki/Jeanne_Baret"
  }
];
