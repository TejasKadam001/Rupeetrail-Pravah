import {zipSync, strToU8} from 'fflate/browser';
import {rupees} from './budget-proposal.js';

export const wordMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const word = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const packageRels = 'http://schemas.openxmlformats.org/package/2006/relationships';
const escape = value => String(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const run = (text, properties = '') => '<w:r><w:rPr>' + properties + '</w:rPr><w:t xml:space="preserve">' + escape(text) + '</w:t></w:r>';
const paragraph = (content, style = 'Normal', props = '') => '<w:p><w:pPr><w:pStyle w:val="' + style + '"/>' + props + '</w:pPr>' + content + '</w:p>';
const p = (text, style, props) => paragraph(run(text),style,props);
const heading = text => p(text,'Heading1');
const right = '<w:jc w:val="right"/>';
const linkStyle = '<w:color w:val="07675E"/><w:u w:val="single"/>';
const bodyWidth = 9640;

function style(id, name, size, color, spacing, extra = '') {
  return '<w:style w:type="paragraph" w:styleId="' + id + '"><w:name w:val="' + name + '"/>' +
    (id === 'Normal' ? '' : '<w:basedOn w:val="Normal"/>') +
    '<w:pPr>' + spacing + '</w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="' +
    color + '"/><w:sz w:val="' + size + '"/>' + extra + '</w:rPr></w:style>';
}
const styles = xml + '<w:styles xmlns:w="' + word + '">' + [
  style('Normal','Normal',22,'20332E','<w:spacing w:after="90" w:line="272" w:lineRule="auto"/>'),
  style('Title','Title',42,'101615','<w:keepNext/><w:spacing w:before="65" w:after="100"/>','<w:b/>'),
  style('Heading1','Heading 1',26,'124F46','<w:keepNext/><w:spacing w:before="160" w:after="55"/><w:outlineLvl w:val="0"/>','<w:b/>'),
  style('Meta','Document details',19,'495F58','<w:spacing w:after="55"/>'),
  style('Cell','Table text',20,'253C34','<w:spacing w:after="25" w:line="234" w:lineRule="auto"/>'),
  style('Small','Table detail',18,'495F58','<w:spacing w:after="15" w:line="215" w:lineRule="auto"/>')
].join('') + '</w:styles>';

function cell(content, width, fill) {
  return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/>' +
    (fill ? '<w:shd w:val="clear" w:fill="' + fill + '"/>' : '') +
    '<w:vAlign w:val="center"/></w:tcPr>' + content + '</w:tc>';
}
function table(widths, labels, body) {
  const header = labels.map((label,i) => cell(paragraph(run(label,'<w:b/><w:color w:val="FFFFFF"/>'),'Cell'), widths[i], '145C52')).join('');
  const row = (values,i) => '<w:tr><w:trPr><w:cantSplit/></w:trPr>' + values.map((s,j) => cell(s,widths[j], i % 2 ? 'FFFFFF' : 'F1F6F3')).join('') + '</w:tr>';
  return '<w:tbl><w:tblPr><w:tblW w:w="' + bodyWidth + '" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar>' +
    ['top','left','bottom','right'].map(side => '<w:' + side + ' w:w="85" w:type="dxa"/>').join('') +
    '</w:tblCellMar></w:tblPr><w:tblGrid>' + widths.map(w => '<w:gridCol w:w="' + w + '"/>').join('') +
    '</w:tblGrid><w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>' + header + '</w:tr>' + body.map(row).join('') + '</w:tbl>';
}
function relationships(entries) {
  return xml + '<Relationships xmlns="' + packageRels + '">' + entries.map(([id,type,target,external]) =>
    '<Relationship Id="' + id + '" Type="' + type + '" Target="' + escape(target) + '"' + (external ? ' TargetMode="External"' : '') + '/>').join('') + '</Relationships>';
}

export function budgetWord(draft, origin) {
  const rels = [['styles',office+'/styles','styles.xml'],['footer',office+'/footer','footer1.xml']];
  function link(label, target) {
    const id = 'link' + rels.length;
    rels.push([id,office+'/hyperlink',new URL(target,origin).href,true]);
    return '<w:hyperlink r:id="' + id + '">' + run(label,linkStyle) + '</w:hyperlink>';
  }
  function roadLink(road) {
    return link(road.id, '/sponsor?' + new URLSearchParams({ward:road.ward,kind:'road',id:road.id}));
  }
  const lead = draft.rows[0];
  const content = [
    p('RupeeTrail   /   Monsoon planning   /   Draft for review','Meta'),
    p(draft.title,'Title'), p(draft.scope + (draft.ward ? '  ·  ' + draft.scopeName : '') + '   |   ' + draft.date,'Meta'),
    p('To the Municipal Commissioner, MCGM   ·   From the ward planning office','Meta'),
    heading('Decision requested'), p(draft.decision),
    table([3213,3213,3214],['Scenario ceiling','Estimated allocation','Unallocated'],[[draft.ceiling,draft.allocated,draft.left].map(v => paragraph(run(rupees(v),'<w:b/>'),'Cell'))]),
    heading('Funding basis'), p(draft.ruleName + '. ' + draft.ruleText), p(draft.baseline)
  ];
  if (lead && draft.detail !== 'brief') {
    content.push(heading('First priority'),paragraph(roadLink(lead) + run(' · ' + lead.name + ', Ward ' + lead.ward + ', leads the funded list with an estimated score of ' + lead.score.toFixed(1) + '/100. ' + lead.evidence.join('. ') + '. ' + lead.action + '.')));
  }
  content.push(heading('Checks before approval'),p(draft.controls.filter((_,i) => !(draft.rule === 'pool' && i === 1)).join(' ')),p(draft.release));
  if (draft.fieldNote) content.push(p(draft.fieldNote));
  if (draft.note) {
    content.push(heading('Ward officer note'));
    for (const line of draft.note.split(/\r?\n/)) content.push(p(line));
  }
  content.push(heading('Evidence and assumptions'),p('Synthetic Mumbai civic records. All proposed costs and risk rankings are estimates. ' + draft.model),
    paragraph(link('Source lineage and join checks','/lineage'),'Meta'));
  if (draft.rows.length) {
    const full = draft.detail === 'full';
    content.push(p(full ? 'Proposed road works' : 'Leading proposed works','Heading1',full ? '<w:pageBreakBefore/>' : ''), p(draft.shownLabel + '  ·  ' + draft.scope,'Meta'));
    const items = draft.rows.map(road => [
      paragraph(run(road.name,'<w:b/>'),'Cell') + paragraph(roadLink(road) + run(' · Ward ' + road.ward + ' · Segment ' + road.segment),'Small'),
      paragraph(run(road.method,'<w:b/>'),'Cell') + p(road.evidence.join('. ') + '.','Small'),
      p(road.score.toFixed(1) + '/100','Cell',right) + p(road.tier,'Small',right),
      paragraph(run(rupees(road.estimate),'<w:b/>'),'Cell',right) + (full ? p(road.basis,'Small',right) : '')
    ]);
    content.push(table([2240,4100,1240,2060],['Road segment','Proposed scope and evidence','Risk estimate','Cost estimate'],items));
  }
  const sect = '<w:sectPr><w:footerReference w:type="default" r:id="footer"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="960" w:right="1133" w:bottom="960" w:left="1133" w:header="430" w:footer="430"/></w:sectPr>';
  const footer = xml + '<w:ftr xmlns:w="' + word + '">' + paragraph(run('RupeeTrail  ·  Synthetic planning estimates     |     Page ')+'<w:fldSimple w:instr="PAGE">'+run('1')+'</w:fldSimple>','Small',right) + '</w:ftr>';
  const parts = {
    '[Content_Types].xml': xml + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>',
    '_rels/.rels': relationships([['doc',office+'/officeDocument','word/document.xml']]),
    'word/document.xml': xml + '<w:document xmlns:w="' + word + '" xmlns:r="' + office + '"><w:body>' + content.join('') + sect + '</w:body></w:document>',
    'word/styles.xml': styles, 'word/footer1.xml': footer, 'word/_rels/document.xml.rels': relationships(rels)
  };
  return zipSync(Object.fromEntries(Object.entries(parts).map(([name,value]) => [name,strToU8(value)])), {level:5});
}

export function draftFilename(draft) {
  const scope = draft.ward ? 'Ward-' + draft.ward.replace(/[^a-z0-9]+/gi,'-') : 'Mumbai';
  return 'RupeeTrail-' + scope + '-' + draft.ceiling + 'INR-' + draft.rule + '-budget-' + (draft.detail === 'brief' ? 'brief' : 'draft') + '.docx';
}
