export const LANGUAGE_CODES: Record<string, string> = {
  english: "en",
  dutch: "nl",
  german: "de",
  french: "fr",
  japanese: "ja",
  chinese: "zh",
  "chinese simplified": "zh",
  portuguese: "pt",
  spanish: "es"
};

export const FIXED_LABELS = {
  en: {
    no_concerns: "No concerns",
    mixed_signals: "Mixed signals",
    concern_found: "Concern found",
    no_data: "No data",
    generated: "Generated",
    office: "Office",
    role: "Role",
    severity_map: "Severity Map",
    severity_intro: "Each card is clickable. The report automatically reorders itself by severity so the most urgent issues rise to the top.",
    bottom_line: "Bottom Line",
    sources: "Sources",
    disclaimer: "Disclaimer",
    plain_english: "Plain English",
    no_data_section: "No data found for this section.",
    footer:
      "This briefing uses public sources and community-reported signal where noted. Community-sourced content is directional and unverified; legal information is informational only and not legal advice.",
    toggle_dark_mode: "Toggle Dark Mode",
    translated_prefix: "[translated from"
  },
  nl: {
    no_concerns: "Geen zorgen",
    mixed_signals: "Gemengde signalen",
    concern_found: "Zorgpunt",
    no_data: "Geen data",
    generated: "Gegenereerd",
    office: "Kantoor",
    role: "Rol",
    severity_map: "Risico-overzicht",
    severity_intro: "Elke kaart is klikbaar. Het rapport wordt automatisch op ernst gesorteerd zodat de belangrijkste signalen bovenaan staan.",
    bottom_line: "Conclusie",
    sources: "Bronnen",
    disclaimer: "Disclaimer",
    plain_english: "In gewone taal",
    no_data_section: "Geen data gevonden voor deze sectie.",
    footer:
      "Deze briefing gebruikt publieke bronnen en, waar vermeld, signalen uit communitybronnen. Community-inhoud is richtinggevend en niet geverifieerd; juridische informatie is alleen informatief en geen juridisch advies.",
    toggle_dark_mode: "Donkere modus",
    translated_prefix: "[vertaald uit"
  },
  de: {
    no_concerns: "Keine Bedenken",
    mixed_signals: "Gemischte Signale",
    concern_found: "Hinweis gefunden",
    no_data: "Keine Daten",
    generated: "Erstellt",
    office: "Standort",
    role: "Rolle",
    severity_map: "Risikokarte",
    severity_intro: "Jede Karte ist anklickbar. Der Bericht wird automatisch nach Schweregrad sortiert, damit die wichtigsten Risiken zuerst erscheinen.",
    bottom_line: "Fazit",
    sources: "Quellen",
    disclaimer: "Hinweis",
    plain_english: "Einfach erklärt",
    no_data_section: "Für diesen Abschnitt wurden keine Daten gefunden.",
    footer:
      "Dieses Briefing nutzt öffentliche Quellen und, wo gekennzeichnet, communitybasierte Signale. Community-Inhalte sind richtungsweisend und nicht verifiziert; rechtliche Informationen dienen nur der Information und sind keine Rechtsberatung.",
    toggle_dark_mode: "Dunkelmodus",
    translated_prefix: "[übersetzt aus"
  },
  fr: {
    no_concerns: "Aucun problème",
    mixed_signals: "Signaux mitigés",
    concern_found: "Point d'attention",
    no_data: "Aucune donnée",
    generated: "Généré",
    office: "Bureau",
    role: "Rôle",
    severity_map: "Carte des risques",
    severity_intro: "Chaque carte est cliquable. Le rapport est automatiquement trié par gravité afin que les signaux les plus importants apparaissent en premier.",
    bottom_line: "En bref",
    sources: "Sources",
    disclaimer: "Avertissement",
    plain_english: "En clair",
    no_data_section: "Aucune donnée trouvée pour cette section.",
    footer:
      "Cette synthèse utilise des sources publiques et, lorsque cela est indiqué, des signaux issus de communautés. Les contenus communautaires sont indicatifs et non vérifiés ; les informations juridiques sont fournies à titre informatif et ne constituent pas un avis juridique.",
    toggle_dark_mode: "Mode sombre",
    translated_prefix: "[traduit de"
  },
  es: {
    no_concerns: "Sin preocupaciones",
    mixed_signals: "Señales mixtas",
    concern_found: "Riesgo encontrado",
    no_data: "Sin datos",
    generated: "Generado",
    office: "Oficina",
    role: "Puesto",
    severity_map: "Mapa de riesgo",
    severity_intro: "Cada tarjeta se puede abrir. El informe se ordena automáticamente por gravedad para que los riesgos más importantes aparezcan primero.",
    bottom_line: "Conclusión",
    sources: "Fuentes",
    disclaimer: "Aviso",
    plain_english: "En pocas palabras",
    no_data_section: "No se encontraron datos para esta sección.",
    footer:
      "Este informe utiliza fuentes públicas y, cuando se indica, señales de fuentes comunitarias. El contenido comunitario es orientativo y no está verificado; la información legal es solo informativa y no constituye asesoramiento legal.",
    toggle_dark_mode: "Modo oscuro",
    translated_prefix: "[traducido de"
  },
  pt: {
    no_concerns: "Sem preocupações",
    mixed_signals: "Sinais mistos",
    concern_found: "Sinal de alerta",
    no_data: "Sem dados",
    generated: "Gerado",
    office: "Escritório",
    role: "Cargo",
    severity_map: "Mapa de risco",
    severity_intro: "Cada cartão é clicável. O relatório é automaticamente ordenado por gravidade para que os riscos mais importantes apareçam primeiro.",
    bottom_line: "Resumo",
    sources: "Fontes",
    disclaimer: "Aviso",
    plain_english: "Em termos simples",
    no_data_section: "Nenhum dado encontrado para esta seção.",
    footer:
      "Este relatório usa fontes públicas e, quando indicado, sinais de fontes comunitárias. Conteúdo comunitário é indicativo e não verificado; informações jurídicas são apenas informativas e não constituem aconselhamento jurídico.",
    toggle_dark_mode: "Modo escuro",
    translated_prefix: "[traduzido de"
  },
  ja: {
    no_concerns: "大きな懸念なし",
    mixed_signals: "判断が分かれる",
    concern_found: "注意点あり",
    no_data: "情報不足",
    generated: "作成日",
    office: "拠点",
    role: "職種",
    severity_map: "リスクマップ",
    severity_intro: "各カードはクリック可能です。重要度の高い項目が先に表示されるよう、自動で並び替えられます。",
    bottom_line: "結論",
    sources: "出典",
    disclaimer: "注意事項",
    plain_english: "かみくだくと",
    no_data_section: "このセクションに関するデータは見つかりませんでした。",
    footer:
      "このレポートは公開情報と、必要に応じてコミュニティ由来のシグナルを使用しています。コミュニティ情報は参考情報であり未検証です。法的情報は情報提供のみを目的としており、法的助言ではありません。",
    toggle_dark_mode: "ダークモード",
    translated_prefix: "[翻訳元:"
  },
  zh: {
    no_concerns: "暂无明显问题",
    mixed_signals: "信号混杂",
    concern_found: "发现风险",
    no_data: "数据不足",
    generated: "生成时间",
    office: "办公室",
    role: "岗位",
    severity_map: "风险概览",
    severity_intro: "每张卡片都可点击。报告会按严重程度自动排序，让最值得关注的问题先出现。",
    bottom_line: "结论",
    sources: "来源",
    disclaimer: "免责声明",
    plain_english: "通俗解释",
    no_data_section: "这一部分没有找到足够数据。",
    footer:
      "本报告使用公开来源，以及在标注情况下使用社区信号。社区内容仅供参考，未经核实；法律相关内容仅供信息参考，不构成法律建议。",
    toggle_dark_mode: "切换深色模式",
    translated_prefix: "[译自"
  }
} as const;

export function languageToHtmlLang(language: string): string {
  return LANGUAGE_CODES[language.trim().toLowerCase()] || "en";
}
