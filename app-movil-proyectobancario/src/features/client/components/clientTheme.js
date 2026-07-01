// src/features/client/components/clientTheme.js
// Paleta, helpers y estilos compartidos por todas las pantallas del cliente
import { Platform, StyleSheet } from 'react-native';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from '../../../shared/constants/theme.js';

export { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS };

export const C = {
  bg:         '#F2F4F7',
  surface:    '#FFFFFF',
  primary:    '#08316D',
  primaryMid: '#0A4A9E',
  accent:     '#00BCD4',
  text:       '#0F172A',
  textSub:    '#64748B',
  textMuted:  '#94A3B8',
  border:     '#E2E8F0',
  success:    '#10B981',
  warning:    '#F59E0B',
  error:      '#EF4444',
  tab:        '#FFFFFF',
};

export const WEB = Platform.OS === 'web'
  ? { outline:'none', outlineWidth:0, border:'none', borderWidth:0, backgroundColor:'transparent' }
  : { backgroundColor:'transparent' };

export const fmt = (n) =>
  new Intl.NumberFormat('es-GT', { style:'currency', currency:'GTQ' }).format(n ?? 0);

export const fmtMonto = (monto, currency) => {
  const abs  = Math.abs(monto ?? 0);
  const sign = monto >= 0 ? '+' : '-';
  const curr = (currency ?? 'GTQ').toUpperCase();
  if (curr === 'GTQ') {
    return sign + new Intl.NumberFormat('es-GT', { style:'currency', currency:'GTQ' }).format(abs);
  }
  return `${sign}${curr} ${new Intl.NumberFormat('es-GT',
    { minimumFractionDigits:2, maximumFractionDigits:2 }).format(abs)}`;
};

// ─── Estilos globales del cliente ─────────────────────────────────────────────
export const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:C.bg },
  topBar: { flexDirection:'row', alignItems:'center', paddingHorizontal:SPACING.lg,
    paddingTop:SPACING.md, paddingBottom:SPACING.sm, backgroundColor:C.bg },
  greet:    { fontSize:FONT_SIZE.sm, color:C.textSub },
  userName: { fontSize:FONT_SIZE.xl, fontWeight:FONT_WEIGHT.bold, color:C.primary },
  iconBtn:  { width:40, height:40, borderRadius:20, backgroundColor:C.surface,
    justifyContent:'center', alignItems:'center', marginLeft:SPACING.sm, ...SHADOWS.sm },
  notifDot: { position:'absolute', top:8, right:8, width:8, height:8,
    borderRadius:4, backgroundColor:C.error, borderWidth:1.5, borderColor:C.surface },
  filterRow: { flexDirection:'row', paddingHorizontal:SPACING.lg, marginBottom:SPACING.md, gap:SPACING.sm },
  filterBtn: { paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm, borderRadius:BORDER_RADIUS.full },
  filterActive: { backgroundColor:C.primary },
  filterTxt: { fontSize:FONT_SIZE.sm, color:C.textSub, fontWeight:FONT_WEIGHT.medium },
  filterTxtActive: { color:'#fff' },
  quickRow:  { flexDirection:'row', paddingHorizontal:SPACING.lg, marginBottom:SPACING.md, gap:SPACING.md },
  quickItem: { flex:1, alignItems:'center', gap:6 },
  quickIcon: { width:54, height:54, borderRadius:27, backgroundColor:C.surface,
    justifyContent:'center', alignItems:'center', ...SHADOWS.sm },
  quickLbl:  { fontSize:FONT_SIZE.xs, color:C.textSub, fontWeight:FONT_WEIGHT.medium },
  recentRow: { flexDirection:'row', alignItems:'center', gap:SPACING.sm, marginHorizontal:SPACING.lg,
    backgroundColor:C.surface, borderRadius:BORDER_RADIUS.lg, padding:SPACING.md,
    marginBottom:SPACING.md, ...SHADOWS.sm },
  recentTxt: { flex:1, fontSize:FONT_SIZE.sm, color:C.primary, fontWeight:FONT_WEIGHT.semibold },
  biCard:       { backgroundColor:C.surface, borderRadius:14, marginBottom:SPACING.lg,
    borderWidth:1, borderColor:C.border, overflow:'hidden',
    shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  biCardHeader: { flexDirection:'row', padding:SPACING.lg, gap:SPACING.sm },
  biCardType:   { fontSize:FONT_SIZE.md, fontWeight:FONT_WEIGHT.bold, color:C.primary, letterSpacing:0.3 },
  biCardNum:    { fontSize:FONT_SIZE.lg, fontWeight:FONT_WEIGHT.bold, color:C.primary, marginTop:4 },
  biCardOwner:  { fontSize:FONT_SIZE.xs, color:C.textMuted, marginTop:4, letterSpacing:0.5 },
  biDivider:    { height:1, backgroundColor:C.border },
  biCardBalance:{ padding:SPACING.lg },
  biBalLbl:     { fontSize:FONT_SIZE.sm, color:C.textSub, marginBottom:4 },
  biBalVal:     { fontSize:32, fontWeight:FONT_WEIGHT.bold, color:C.text },
  biCardMeta:   { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:SPACING.lg, paddingVertical:SPACING.md },
  biMetaLbl:    { fontSize:10, color:C.textMuted, marginBottom:2 },
  biMetaVal:    { fontSize:FONT_SIZE.sm, color:C.text, fontWeight:FONT_WEIGHT.semibold },
  biCardActions:{ flexDirection:'row', alignItems:'center' },
  biAction:     { flex:1, alignItems:'center', paddingVertical:SPACING.md, gap:4 },
  biActionTxt:  { fontSize:FONT_SIZE.sm, color:C.primary, fontWeight:FONT_WEIGHT.semibold },
  biActionSep:  { width:1, height:40, backgroundColor:C.border },
  pageTitle: { fontSize:FONT_SIZE.xxl, fontWeight:FONT_WEIGHT.bold, color:C.primary, marginBottom:4 },
  pageSub:   { fontSize:FONT_SIZE.sm, color:C.textSub, marginBottom:SPACING.lg },
  listCard:  { backgroundColor:C.surface, borderRadius:BORDER_RADIUS.lg,
    padding:SPACING.lg, marginBottom:SPACING.md },
  emptyCard: { backgroundColor:C.surface, borderRadius:BORDER_RADIUS.xl, padding:SPACING.xxl,
    alignItems:'center', gap:SPACING.md, ...SHADOWS.sm, margin:SPACING.sm },
  emptyTxt:  { fontSize:FONT_SIZE.lg, fontWeight:FONT_WEIGHT.semibold, color:C.text },
  emptySub:  { fontSize:FONT_SIZE.sm, color:C.textSub, textAlign:'center' },
  infoBox: { flexDirection:'row', alignItems:'flex-start', gap:SPACING.sm,
    backgroundColor:'#EFF6FF', borderRadius:BORDER_RADIUS.md, padding:SPACING.md,
    marginBottom:SPACING.md },
  infoTxt: { flex:1, fontSize:FONT_SIZE.sm, color:C.primaryMid, lineHeight:18 },
});

export const pb = StyleSheet.create({
  btn:  { height:52, borderRadius:BORDER_RADIUS.full, backgroundColor:C.primary,
    justifyContent:'center', alignItems:'center', flexDirection:'row', gap:8, ...SHADOWS.md },
  ghost:{ backgroundColor:'transparent', elevation:0, borderWidth:1.5, borderColor:C.primary },
  lbl:  { fontSize:FONT_SIZE.md, fontWeight:FONT_WEIGHT.bold, color:'#fff' },
  lblG: { color:C.primary },
});

export const hist = StyleSheet.create({
  header:      { flexDirection:'row', alignItems:'center', paddingHorizontal:SPACING.lg,
    paddingTop:SPACING.lg, paddingBottom:SPACING.sm, gap:SPACING.md,
    backgroundColor:C.bg, borderBottomWidth:1, borderBottomColor:C.border },
  formTitle:   { fontSize:FONT_SIZE.md, fontWeight:FONT_WEIGHT.bold, color:C.primary, marginBottom:SPACING.md },
  tableCard:   { backgroundColor:C.surface, borderRadius:BORDER_RADIUS.xl, overflow:'hidden', ...SHADOWS.md },
  tableTitle:  { paddingHorizontal:SPACING.lg, paddingVertical:SPACING.md,
    borderBottomWidth:1, borderBottomColor:C.border },
  tableTitleTxt:{ fontSize:FONT_SIZE.md, fontWeight:FONT_WEIGHT.bold, color:C.text },
  thead:       { flexDirection:'row', paddingVertical:SPACING.sm+2,
    borderBottomWidth:1, borderBottomColor:C.border, backgroundColor:'#F8FAFC' },
  th:          { width:120, fontSize:9, fontWeight:FONT_WEIGHT.bold, color:C.primary,
    textTransform:'uppercase', letterSpacing:0.3, paddingHorizontal:SPACING.sm },
  tr:          { flexDirection:'row', paddingVertical:SPACING.md,
    borderBottomWidth:1, borderBottomColor:C.border, alignItems:'center', minHeight:48 },
  trAlt:       { backgroundColor:'#FAFBFC' },
  td:          { fontSize:FONT_SIZE.xs, color:C.text, paddingHorizontal:SPACING.sm },
  tdAcc:       { color:C.primary, fontWeight:FONT_WEIGHT.semibold },
  tdAmount:    { fontWeight:FONT_WEIGHT.bold },
  colAcc:      { width:130 },
  colMonto:    { width:90 },
  colNum:      { width:120, fontSize:FONT_SIZE.xs, paddingHorizontal:SPACING.sm },
  colDesc:     { width:150, fontSize:FONT_SIZE.xs, color:C.text, paddingHorizontal:SPACING.sm },
  colEstado:   { width:90, paddingHorizontal:SPACING.sm },
  colFecha:    { width:90, fontSize:FONT_SIZE.xs, paddingHorizontal:SPACING.sm },
  statusPill:  { paddingHorizontal:8, paddingVertical:4, borderRadius:99, alignSelf:'flex-start' },
  statusTxt:   { fontSize:10, fontWeight:FONT_WEIGHT.semibold, textTransform:'capitalize' },
  loadingRow:  { padding:SPACING.xl, alignItems:'center' },
  emptyRow:    { padding:SPACING.xl, alignItems:'center', gap:SPACING.md },
  emptyTxt:    { fontSize:FONT_SIZE.md, color:C.textMuted },
});

export const nf = StyleSheet.create({
  sheet:    { backgroundColor:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24,
    maxHeight:'75%', paddingHorizontal:SPACING.lg },
  handle:   { width:36, height:4, borderRadius:2, backgroundColor:C.border,
    alignSelf:'center', marginTop:SPACING.md, marginBottom:SPACING.sm },
  hdr:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingVertical:SPACING.md, borderBottomWidth:1, borderBottomColor:C.border, marginBottom:SPACING.sm },
  title:    { fontSize:FONT_SIZE.xl, fontWeight:FONT_WEIGHT.bold, color:C.text },
  empty:    { alignItems:'center', paddingVertical:SPACING.xxl, gap:SPACING.md },
  emptyTxt: { fontSize:FONT_SIZE.lg, fontWeight:FONT_WEIGHT.semibold, color:C.text },
  emptySub: { fontSize:FONT_SIZE.sm, color:C.textMuted, textAlign:'center' },
  clearBtn: { alignSelf:'flex-end', paddingVertical:SPACING.xs, paddingHorizontal:SPACING.sm, marginBottom:SPACING.sm },
  clearTxt: { fontSize:FONT_SIZE.xs, color:C.primaryMid, fontWeight:FONT_WEIGHT.medium },
  item:     { flexDirection:'row', alignItems:'flex-start', paddingVertical:SPACING.md,
    borderBottomWidth:1, borderBottomColor:C.border, gap:SPACING.md },
  icon:     { width:42, height:42, borderRadius:21, justifyContent:'center', alignItems:'center', flexShrink:0 },
  itemTitle:{ fontSize:FONT_SIZE.sm, fontWeight:FONT_WEIGHT.semibold, color:C.text },
  itemSub:  { fontSize:FONT_SIZE.xs, color:C.textSub, marginTop:2 },
  itemDate: { fontSize:FONT_SIZE.xs, color:C.textMuted, marginTop:2 },
  itemAmt:  { fontSize:FONT_SIZE.sm, fontWeight:FONT_WEIGHT.bold, flexShrink:0, marginTop:2 },
});
