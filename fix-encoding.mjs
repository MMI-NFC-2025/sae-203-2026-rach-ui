/**
 * fix-encoding.mjs
 * Corrige les caractères U+FFFD (EF BF BD) dans les fichiers .astro
 * causés par une lecture CP1252 interprétée comme UTF-8.
 *
 * Usage: node fix-encoding.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const FFFD = "\uFFFD";

// Table de remplacement : chaîne corrompue → chaîne correcte
// Ordre important : les chaînes plus longues d'abord pour éviter les substitutions partielles
const replacements = [
    // Mots complets avec plusieurs FFFD
    ["Coordonn\uFFFDes", "Coordonnées"],
    ["Email g\uFFFDn\uFFFDral", "Email général"],
    ["Email G\uFFFDn\uFFFDral", "Email Général"],
    ["T\uFFFDl\uFFFDphone", "Téléphone"],
    ["t\uFFFDl\uFFFDphone", "téléphone"],
    ["T\uFFFDl.", "Tél."],
    ["Accessibilit\uFFFD", "Accessibilité"],
    ["accessibilit\uFFFD", "accessibilité"],
    ["Pr\uFFFDnom", "Prénom"],
    ["pr\uFFFDnom", "prénom"],
    ["pi\uFFFDce d'identit\uFFFD", "pièce d'identité"],
    ["Pi\uFFFDce d'identit\uFFFD", "Pièce d'identité"],
    ["d'identit\uFFFD", "d'identité"],
    ["identit\uFFFD", "identité"],
    ["pi\uFFFDce", "pièce"],
    ["Pi\uFFFDce", "Pièce"],
    ["9h \uFFFD 18h", "9h à 18h"],
    ["\uFFFD partir de", "À partir de"],
    ["\uFFFD l'entr\uFFFDe", "à l'entrée"],
    ["l'entr\uFFFDe", "l'entrée"],
    ["entr\uFFFDe", "entrée"],
    ["Entr\uFFFDe", "Entrée"],
    ["R\uFFFDserve", "Réserve"],
    ["r\uFFFDserve", "réserve"],
    ["R\uFFFDservation", "Réservation"],
    ["H\uFFFDbergement", "Hébergement"],
    ["h\uFFFDbergement", "hébergement"],
    ["H\uFFFDtel", "Hôtel"],
    ["h\uFFFDtel", "hôtel"],
    ["En-t\uFFFDte", "En-tête"],
    ["en-t\uFFFDte", "en-tête"],
    ["t\uFFFDtes d'affiche", "têtes d'affiche"],
    ["T\uFFFDtes", "Têtes"],
    ["t\uFFFDtes", "têtes"],
    ["t\uFFFDte", "tête"],
    ["Ao\uFFFDt", "Août"],
    ["ao\uFFFDt", "août"],
    ["Sc\uFFFDne principale", "Scène principale"],
    ["Sc\uFFFDne secondaire", "Scène secondaire"],
    ["Sc\uFFFDne Principale", "Scène Principale"],
    ["Sc\uFFFDne Secondaire", "Scène Secondaire"],
    ["sc\uFFFDne principale", "scène principale"],
    ["sc\uFFFDne secondaire", "scène secondaire"],
    ["les sc\uFFFDnes", "les scènes"],
    ["Les sc\uFFFDnes", "Les scènes"],
    ["Les Sc\uFFFDnes", "Les Scènes"],
    ["toutes les sc\uFFFDnes", "toutes les scènes"],
    ["Sc\uFFFDne", "Scène"],
    ["sc\uFFFDne", "scène"],
    ["La Clairi\uFFFDre Sonore", "La Clairière Sonore"],
    ["la clairi\uFFFDre", "la clairière"],
    ["Clairi\uFFFDre", "Clairière"],
    ["clairi\uFFFDre", "clairière"],
    ["presqu'\uFFFDle", "presqu'île"],
    ["c\uFFFDur", "cœur"],
    ["C\uFFFDur", "Cœur"],
    ["fran\uFFFDais", "français"],
    ["Fran\uFFFDais", "Français"],
    ["plan\uFFFDtaires", "planétaires"],
    ["\uFFFDnergie", "énergie"],
    ["\uFFFDlectrisante", "électrisante"],
    ["\uFFFDlectronique", "électronique"],
    ["\uFFFDlectrique", "électrique"],
    ["\uFFFDlectro", "électro"],
    ["\uFFFDcran", "écran"],
    ["\uFFFDcrin", "écrin"],
    ["\uFFFDquipe", "équipe"],
    ["\uFFFDdition", "édition"],
    ["\uFFFDveil", "éveil"],
    ["\uFFFDnergie", "énergie"],
    ["cl\uFFFDture", "clôture"],
    ["Cl\uFFFDture", "Clôture"],
    ["premi\uFFFDre", "première"],
    ["Premi\uFFFDre", "Première"],
    ["premi\uFFFDr", "premièr"],
    ["n\uFFFDerlandais", "néerlandais"],
    ["N\uFFFDerlandais", "Néerlandais"],
    ["embl\uFFFDmatique", "emblématique"],
    ["Embl\uFFFDmatique", "Emblématique"],
    ["d\uFFFDroulent", "déroulent"],
    ["d\uFFFDdi\uFFFDe", "dédiée"],
    ["d\uFFFDdi\uFFFD", "dédié"],
    ["D\uFFFDdi\uFFFDe", "Dédiée"],
    ["D\uFFFDdi\uFFFD", "Dédié"],
    ["S\uFFFDcurit\uFFFD", "Sécurité"],
    ["s\uFFFDcurit\uFFFD", "sécurité"],
    ["S\uFFFDcurit", "Sécurit"],
    ["s\uFFFDcurit", "sécurit"],
    ["s\uFFFDcuris", "sécuris"],
    ["g\uFFFDn\uFFFDrale", "générale"],
    ["G\uFFFDn\uFFFDrale", "Générale"],
    ["g\uFFFDn\uFFFDral", "général"],
    ["G\uFFFDn\uFFFDral", "Général"],
    ["Coordination g\uFFFDn\uFFFDrale", "Coordination générale"],
    ["coordination g\uFFFDn\uFFFDrale", "coordination générale"],
    ["Lumi\uFFFDre", "Lumière"],
    ["lumi\uFFFDre", "lumière"],
    ["L\uFFFDa Petit", "Léa Petit"],
    ["L\uFFFDa", "Léa"],
    ["num\uFFFDrique", "numérique"],
    ["Num\uFFFDrique", "Numérique"],
    ["m\uFFFDt\uFFFDorologiques", "météorologiques"],
    ["m\uFFFDt\uFFFD", "météo"],
    ["M\uFFFDt\uFFFD", "Météo"],
    ["v\uFFFDg\uFFFDtarienne", "végétarienne"],
    ["v\uFFFDg\uFFFDtalienne", "végétalienne"],
    ["capacit\uFFFD", "capacité"],
    ["Capacit\uFFFD", "Capacité"],
    ["am\uFFFDnagements", "aménagements"],
    ["Am\uFFFDnagement", "Aménagement"],
    ["am\uFFFDnagement", "aménagement"],
    ["sp\uFFFDcifiques", "spécifiques"],
    ["proximit\uFFFD", "proximité"],
    ["synchronis\uFFFDes", "synchronisées"],
    ["synchronis\uFFFD", "synchronisé"],
    ["dispers\uFFFDes", "dispersées"],
    ["atmosph\uFFFDre", "atmosphère"],
    ["exp\uFFFDrience", "expérience"],
    ["f\uFFFDerique", "féerique"],
    ["cr\uFFFDant", "créant"],
    ["cr\uFFFDation", "création"],
    ["Cr\uFFFDation", "Création"],
    ["cr\uFFFDativit\uFFFD", "créativité"],
    ["Cr\uFFFDativit\uFFFD", "Créativité"],
    ["sonorit\uFFFDs", "sonorités"],
    ["m\uFFFDlodies", "mélodies"],
    ["vari\uFFFDs", "variés"],
    ["vari\uFFFDe", "variée"],
    ["vari\uFFFD\uFFFD", "variées"],
    ["qualit\uFFFD", "qualité"],
    ["Qualit\uFFFD", "Qualité"],
    ["chor\uFFFDgraphies", "chorégraphies"],
    ["syst\uFFFDme", "système"],
    ["Syst\uFFFDme", "Système"],
    ["Nich\uFFFDe", "Nichée"],
    ["nich\uFFFDe", "nichée"],
    ["o\uFFFD la", "où la"],
    ["o\uFFFD chacun", "où chacun"],
    ["15\uFFFD /", "15€ /"],
    ["XX\uFFFD", "XX€"],
    ["\uFFFD partir de 75\uFFFD", "à partir de 75€"],
    ["\uFFFD partir de 65\uFFFD", "à partir de 65€"],
    ["\uFFFD partir de 90\uFFFD", "à partir de 90€"],
    ["\uFFFD partir de XX\uFFFD", "à partir de XX€"],
    ["75\uFFFD /", "75€ /"],
    ["65\uFFFD /", "65€ /"],
    ["90\uFFFD /", "90€ /"],
    ["5\uFFFD sur", "5€ sur"],
    ["2\uFFFD l'aller", "2€ l'aller"],
    ["Message envoy\uFFFD", "Message envoyé"],
    ["Erreur, r\uFFFDessayez", "Erreur, réessayez"],
    ["r\uFFFDessayez", "réessayez"],
    ["r\uFFFDponses", "réponses"],
    ["R\uFFFDponses", "Réponses"],
    ["r\uFFFDponse", "réponse"],
    ["R\uFFFDponse", "Réponse"],
    ["fr\uFFFDquentes", "fréquentes"],
    ["Fr\uFFFDquentes", "Fréquentes"],
    ["fr\uFFFDquent", "fréquent"],
    ["actualit\uFFFD", "actualité"],
    ["Actualit\uFFFD", "Actualité"],
    ["Depuis Besan\uFFFDon", "Depuis Besançon"],
    ["Besan\uFFFDon", "Besançon"],
    ["D\uFFFDpuis", "Depuis"],
    ["d\uFFFDpuis", "depuis"],
    ["R\uFFFDduction", "Réduction"],
    ["r\uFFFDduction", "réduction"],
    ["pr\uFFFDf\uFFFDrentiels", "préférentiels"],
    ["Pr\uFFFDf\uFFFDrentiels", "Préférentiels"],
    ["d\uFFFDdi\uFFFD", "dédié"],
    ["D\uFFFDdi\uFFFD", "Dédié"],
    ["alcoolis\uFFFDs", "alcoolisés"],
    ["alcoolis\uFFFD", "alcoolisé"],
    ["distribu\uFFFDs", "distribués"],
    ["distribu\uFFFD", "distribué"],
    ["pr\uFFFDsents", "présents"],
    ["pr\uFFFDsent", "présent"],
    ["pr\uFFFDsentation", "présentation"],
    ["Pr\uFFFDsentation", "Présentation"],
    ["pr\uFFFDvu", "prévu"],
    ["pr\uFFFDvus", "prévus"],
    ["convivialit\uFFFD", "convivialité"],
    ["sp\uFFFDcialit\uFFFDs", "spécialités"],
    ["sp\uFFFDcialit\uFFFD", "spécialité"],
    ["billet (format papier ou num\uFFFDrique)", "billet (format papier ou numérique)"],
    ["pr\uFFFDsentation de", "présentation de"],
    ["r\uFFFDgion", "région"],
    ["R\uFFFDgion", "Région"],
    ["s\uFFFDrie", "série"],
    ["S\uFFFDrie", "Série"],
    ["in\uFFFDdites", "inédites"],
    ["In\uFFFDdites", "Inédites"],
    ["perp\uFFFDtuel", "perpétuel"],
    ["Perp\uFFFDtuel", "Perpétuel"],
    ["Divertissement", "Divertissement"],
    ["pens\uFFFDes", "pensées"],
    ["Pens\uFFFDes", "Pensées"],
    ["d\uFFFDtente", "détente"],
    ["D\uFFFDtente", "Détente"],
    ["inoubliables", "inoubliables"],
    ["Eurroc\uFFFDennes", "Eurockeénnes"],
    ["Eurock\uFFFDennes", "Eurockéennes"],
    ["R\uFFFDveaulac", "Réveaulac"],
    ["L'\uFFFDveil", "L'Éveil"],
    ["L\uFFFDnergie", "L'Énergie"],
    ["L'\uFFFDnergie", "L'Énergie"],
    ["l'\uFFFDnergie", "l'énergie"],
    ["L'Ap\uFFFDg\uFFFDe", "L'Apogée"],
    ["ap\uFFFDg\uFFFDe", "apogée"],
    ["Ap\uFFFDg\uFFFDe", "Apogée"],
    ["M\uFFFDlange", "Mélange"],
    ["m\uFFFDlange", "mélange"],
    ["Vendredi : L'\uFFFDveil", "Vendredi : L'Éveil"],
    ["L'\uFFFDveil \uFFFD L'\uFFFDnergie", "L'Éveil — L'Énergie"],
    ["La Fusion \uFFFD M\uFFFDlange", "La Fusion — Mélange"],
    ["L'Apog\uFFFDe \uFFFD La cl\uFFFDture", "L'Apogée — La clôture"],
    // separateurs tiret em
    [" \uFFFD ", " — "],
    ["\uFFFD {", "— {"],
    // Caractères seuls restants
    ["\uFFFD", ""],
];

function fixContent(content) {
    let result = content;
    for (const [from, to] of replacements) {
        // Remplacer toutes les occurrences
        while (result.includes(from)) {
            result = result.split(from).join(to);
        }
    }
    return result;
}

function walkDir(dir, callback) {
    for (const entry of readdirSync(dir)) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath, callback);
        } else if (extname(entry) === ".astro") {
            callback(fullPath);
        }
    }
}

const srcDir = "C:\\Users\\rachi\\Documents\\GitHub\\sae-203-2026-rach-ui\\src";
let fixed = 0;
let skipped = 0;

walkDir(srcDir, (filePath) => {
    try {
        const content = readFileSync(filePath, "utf8");
        if (!content.includes(FFFD)) {
            skipped++;
            return;
        }
        const newContent = fixContent(content);
        writeFileSync(filePath, newContent, "utf8");
        console.log(`✓ Fixed: src${filePath.slice(srcDir.length).replace(/\\/g, "/")}`);
        fixed++;
    } catch (e) {
        console.error(`✗ Error on ${filePath}: ${e.message}`);
    }
});

console.log(`\nDone: ${fixed} file(s) fixed, ${skipped} file(s) skipped (no FFFD).`);
