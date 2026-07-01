// src/features/client/components/ClientUI.jsx
// Componentes UI compartidos: Banner, LInput, LSelect, PBtn, LModal, Badge,
// AccountCard, AnimatedCard, AnimatedPressable, Toast, ToastContainer, DrawerMenu, TabBar
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Animated,
  Easing, PanResponder, Dimensions, Image, Platform, Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, WEB, fmt, s, pb, SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOWS } from './clientTheme.js';

const { width: W } = Dimensions.get('window');

// ─── Banner ───────────────────────────────────────────────────────────────────
export const Banner = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const isE = type === 'error';
  return (
    <View style={[bn.w, { borderLeftColor: isE ? C.error : C.success,
      backgroundColor: isE ? '#FEF2F2' : '#F0FDF4' }]}>
      <MaterialIcons name={isE ? 'error-outline' : 'check-circle'} size={15}
        color={isE ? C.error : C.success} />
      <Text style={[bn.t, { color: isE ? C.error : C.success }]}>{msg}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}>
        <MaterialIcons name="close" size={15} color={C.textMuted} />
      </TouchableOpacity>
    </View>
  );
};
const bn = StyleSheet.create({
  w: { flexDirection:'row', alignItems:'center', gap:8, borderLeftWidth:3,
    borderRadius:8, padding:12, marginBottom:12 },
  t: { flex:1, fontSize:FONT_SIZE.sm, lineHeight:18 },
});

// ─── LInput ───────────────────────────────────────────────────────────────────
export const LInput = ({ label, value, onChangeText, placeholder, numeric, required, secure, multiline }) => {
  const [focused, setFocused] = useState(false);
  const [hidden,  setHidden]  = useState(!!secure);
  const li = StyleSheet.create({
    lbl: { fontSize:FONT_SIZE.xs, color:C.textSub, fontWeight:FONT_WEIGHT.semibold,
      marginBottom:6, textTransform:'uppercase', letterSpacing:0.4 },
    row: { flexDirection:'row', alignItems:'center', borderWidth:1.5,
      borderColor: focused ? C.primaryMid : C.border,
      borderRadius:BORDER_RADIUS.md, paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm+2,
      backgroundColor:C.surface, gap:8 },
    inp: { flex:1, fontSize:FONT_SIZE.md, color:C.text },
  });
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label && (
        <Text style={li.lbl}>{label}{required && <Text style={{ color:C.accent }}> *</Text>}</Text>
      )}
      <View style={li.row}>
        <TextInput style={[li.inp, WEB]} value={value} onChangeText={onChangeText}
          placeholder={placeholder ?? label} placeholderTextColor={C.textMuted}
          keyboardType={numeric ? 'decimal-pad' : 'default'} secureTextEntry={hidden}
          autoCapitalize="none" autoCorrect={false} multiline={multiline}
          returnKeyType={multiline ? 'default' : 'done'}
          blurOnSubmit={!multiline}
          onSubmitEditing={() => { if (!multiline) Keyboard.dismiss(); }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        {secure && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <MaterialIcons name={hidden ? 'visibility-off' : 'visibility'} size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── LSelect ──────────────────────────────────────────────────────────────────
export const LSelect = ({ label, value, options, onSelect, required }) => {
  const [open, setOpen] = useState(false);
  const found = options.find(o => (o.v ?? o) === value);
  const lbl   = found ? (found.l ?? found) : 'Seleccionar…';
  const li = StyleSheet.create({
    lbl: { fontSize:FONT_SIZE.xs, color:C.textSub, fontWeight:FONT_WEIGHT.semibold,
      marginBottom:6, textTransform:'uppercase', letterSpacing:0.4 },
    row: { flexDirection:'row', alignItems:'center', borderWidth:1.5, borderColor:C.border,
      borderRadius:BORDER_RADIUS.md, paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm+2,
      backgroundColor:C.surface, gap:8 },
  });
  return (
    <View style={{ marginBottom: SPACING.md }}>
      {label && <Text style={li.lbl}>{label}{required && <Text style={{ color:C.accent }}> *</Text>}</Text>}
      <TouchableOpacity style={[li.row, { justifyContent:'space-between' }]}
        onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={{ flex:1, fontSize:FONT_SIZE.md, color: value ? C.text : C.textMuted }}>{lbl}</Text>
        <MaterialIcons name="expand-more" size={20} color={C.textMuted} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={ls.bd} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={ls.sh}>
            {label && <Text style={ls.ttl}>{label}</Text>}
            <ScrollView>
              {options.map(o => {
                const v = o.v ?? o; const l = o.l ?? o;
                return (
                  <TouchableOpacity key={v} style={ls.opt}
                    onPress={() => { onSelect(v); setOpen(false); }}>
                    <Text style={[ls.oTxt, value===v && { color:C.primaryMid, fontWeight:FONT_WEIGHT.semibold }]}>{l}</Text>
                    {value===v && <MaterialIcons name="check" size={16} color={C.primaryMid} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
const ls = StyleSheet.create({
  bd:  { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' },
  sh:  { backgroundColor:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24,
    padding:SPACING.lg, maxHeight:'60%' },
  ttl: { fontSize:FONT_SIZE.lg, fontWeight:FONT_WEIGHT.bold, color:C.text, marginBottom:SPACING.md },
  opt: { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingVertical:SPACING.md, borderBottomWidth:1, borderBottomColor:C.border },
  oTxt:{ fontSize:FONT_SIZE.md, color:C.text },
});

// ─── PBtn ─────────────────────────────────────────────────────────────────────
export const PBtn = ({ title, onPress, loading, ghost, style, icon }) => (
  <TouchableOpacity style={[pb.btn, ghost && pb.ghost, style]}
    onPress={onPress} disabled={loading} activeOpacity={0.85}>
    {loading
      ? <ActivityIndicator color={ghost ? C.primary : '#fff'} size="small" />
      : <>
          {icon && <MaterialIcons name={icon} size={18} color={ghost ? C.primary : '#fff'} />}
          <Text style={[pb.lbl, ghost && pb.lblG]}>{title}</Text>
        </>}
  </TouchableOpacity>
);

// ─── LModal ───────────────────────────────────────────────────────────────────
export const LModal = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={lm.bd}>
      <View style={lm.sh}>
        <View style={lm.hdl} />
        <View style={lm.hdr}>
          <Text style={lm.ttl}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <MaterialIcons name="close" size={22} color={C.textSub} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
          <View style={{ height:40 }} />
        </ScrollView>
      </View>
    </View>
  </Modal>
);
const lm = StyleSheet.create({
  bd:  { flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' },
  sh:  { backgroundColor:C.surface, borderTopLeftRadius:24, borderTopRightRadius:24,
    padding:SPACING.lg, maxHeight:'90%' },
  hdl: { width:36, height:4, borderRadius:2, backgroundColor:C.border,
    alignSelf:'center', marginBottom:SPACING.md },
  hdr: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:SPACING.lg },
  ttl: { fontSize:FONT_SIZE.xl, fontWeight:FONT_WEIGHT.bold, color:C.text },
});

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ status }) => {
  const m = {
    activa:   { bg:'#F0FDF4', c:C.success },   activo:   { bg:'#F0FDF4', c:C.success },
    bloqueada:{ bg:'#FFFBEB', c:C.warning },   inactiva: { bg:'#FEF2F2', c:C.error   },
    pendiente:{ bg:'#FFFBEB', c:C.warning },   pagado:   { bg:'#EFF6FF', c:C.primaryMid },
    rechazado:{ bg:'#FEF2F2', c:C.error   },   credito:  { bg:'#F5F3FF', c:'#7C3AED' },
    debito:   { bg:'#EFF6FF', c:C.primaryMid },
  };
  const cfg = m[status] ?? { bg:C.bg, c:C.textSub };
  return (
    <View style={[bdg.p, { backgroundColor:cfg.bg }]}>
      <Text style={[bdg.t, { color:cfg.c }]}>{status}</Text>
    </View>
  );
};
const bdg = StyleSheet.create({
  p: { paddingHorizontal:10, paddingVertical:3, borderRadius:99, alignSelf:'flex-start' },
  t: { fontSize:10, fontWeight:FONT_WEIGHT.semibold, textTransform:'capitalize' },
});

// ─── AccountCard ──────────────────────────────────────────────────────────────
const BLOCKED_BG='#FFF5F5', BLOCKED_BDR='#FCA5A5', BLOCKED_TXT='#DC2626';
const INACTIVE_BG='#F8F9FA', INACTIVE_BDR='#D1D5DB', INACTIVE_TXT='#6B7280';

export function AccountCard({ acc, displayName, style, showFavorite, isFav, onFavorite,
  onTransfer, onHistory, onDeposit }) {
  const tipo=    (acc.accountType??acc.type??'Cuenta').toUpperCase();
  const moneda=   acc.currency??acc.currencyCode??'GTQ';
  const numero=   acc.accountNumber??'—';
  const balance=  acc.balance??acc.availableBalance??0;
  const estado=   acc._displayStatus??acc.status??'activa';
  const apertura= acc.openingDate??acc.createdAt;
  const limite=   acc.dailyWithdrawalLimit??acc.withdrawalLimit??0;
  const isBloqueada= estado==='bloqueada', isInactiva= estado==='inactiva';
  const isRestricted= isBloqueada||isInactiva;
  const pulseAnim= useRef(new Animated.Value(1)).current;
  useEffect(()=>{
    if(!isBloqueada) return;
    const p= Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim,{toValue:0.6,duration:900,easing:t=>t,useNativeDriver:false}),
      Animated.timing(pulseAnim,{toValue:1,duration:900,easing:t=>t,useNativeDriver:false}),
    ]));
    p.start(); return()=>p.stop();
  },[isBloqueada]);
  const cardBg= isBloqueada?BLOCKED_BG:isInactiva?INACTIVE_BG:C.surface;
  const cardBdr= isBloqueada?BLOCKED_BDR:isInactiva?INACTIVE_BDR:C.border;
  const typeTxt= isBloqueada?BLOCKED_TXT:isInactiva?INACTIVE_TXT:C.primary;
  const numTxt=  isBloqueada?BLOCKED_TXT:isInactiva?INACTIVE_TXT:C.primary;
  const balTxt=  isBloqueada?BLOCKED_TXT:isInactiva?INACTIVE_TXT:C.text;
  const btnColor= isRestricted?C.textMuted:C.primary;
  return (
    <View style={[s.biCard,{backgroundColor:cardBg,borderColor:cardBdr},style]}>
      {isBloqueada&&(
        <Animated.View style={{opacity:pulseAnim,backgroundColor:'#DC2626',paddingVertical:6,
          paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:8}}>
          <MaterialIcons name="lock" size={14} color="#fff"/>
          <Text style={{color:'#fff',fontSize:11,fontWeight:FONT_WEIGHT.bold,letterSpacing:0.5}}>
            CUENTA BLOQUEADA — Contacta con tu banco
          </Text>
        </Animated.View>
      )}
      {isInactiva&&(
        <View style={{backgroundColor:INACTIVE_BDR,paddingVertical:5,paddingHorizontal:16,
          flexDirection:'row',alignItems:'center',gap:8}}>
          <MaterialIcons name="pause-circle" size={14} color={INACTIVE_TXT}/>
          <Text style={{color:INACTIVE_TXT,fontSize:11,fontWeight:FONT_WEIGHT.bold,letterSpacing:0.5}}>CUENTA INACTIVA</Text>
        </View>
      )}
      <View style={[s.biCardHeader,{backgroundColor:isBloqueada?'#FEF2F2':isInactiva?'#F3F4F6':'transparent'}]}>
        <View style={{flex:1}}>
          <Text style={[s.biCardType,{color:typeTxt}]}>{`CUENTA ${tipo}`}</Text>
          <Text style={[s.biCardNum,{color:numTxt}]}>{numero}</Text>
          <Text style={s.biCardOwner}>{displayName.toUpperCase()}</Text>
        </View>
        <View style={{alignItems:'flex-end',gap:6}}>
          {showFavorite&&(
            <TouchableOpacity onPress={onFavorite} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name={isFav?'star':'star-border'} size={22} color={isFav?'#F59E0B':C.textMuted}/>
            </TouchableOpacity>
          )}
          <Badge status={estado}/>
          <Text style={{fontSize:10,color:C.textMuted}}>{moneda}</Text>
        </View>
      </View>
      <View style={[s.biDivider,{backgroundColor:cardBdr}]}/>
      <View style={s.biCardBalance}>
        <Text style={s.biBalLbl}>Saldo disponible</Text>
        <Text style={[s.biBalVal,{color:balTxt}]}>
          {isBloqueada ? '••••••' : (()=>{
            const sym = {GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[moneda]??moneda+' ';
            return `${sym} ${(balance??0).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
          })()}
        </Text>
        {isBloqueada&&<Text style={{fontSize:11,color:BLOCKED_TXT,marginTop:4}}>Saldo oculto — cuenta restringida</Text>}
      </View>
      <View style={[s.biDivider,{backgroundColor:cardBdr}]}/>
      {!isBloqueada&&(
        <>
          <View style={s.biCardMeta}>
            <View style={{gap:2}}>
              <Text style={s.biMetaLbl}>Fecha de apertura</Text>
              <Text style={s.biMetaVal}>{apertura?new Date(apertura).toLocaleDateString('es-GT'):'—'}</Text>
            </View>
            <View style={{gap:2,alignItems:'flex-end'}}>
              <Text style={s.biMetaLbl}>Límite diario</Text>
              <Text style={s.biMetaVal}>{fmt(limite)}</Text>
            </View>
          </View>
          <View style={[s.biDivider,{backgroundColor:cardBdr}]}/>
        </>
      )}
      <View style={[s.biCardActions,isRestricted&&{opacity:0.4}]}>
        <TouchableOpacity style={s.biAction} onPress={isRestricted?undefined:onTransfer} disabled={isRestricted}>
          <MaterialIcons name="swap-horiz" size={20} color={btnColor}/>
          <Text style={[s.biActionTxt,{color:btnColor}]}>Transferir</Text>
        </TouchableOpacity>
        <View style={[s.biActionSep,{backgroundColor:cardBdr}]}/>
        <TouchableOpacity style={s.biAction} onPress={onHistory}>
          <MaterialIcons name="receipt-long" size={20} color={C.primary}/>
          <Text style={s.biActionTxt}>Historial</Text>
        </TouchableOpacity>
        <View style={[s.biActionSep,{backgroundColor:cardBdr}]}/>
        <TouchableOpacity style={s.biAction} onPress={isRestricted?undefined:onDeposit} disabled={isRestricted}>
          <MaterialIcons name="arrow-downward" size={20} color={btnColor}/>
          <Text style={[s.biActionTxt,{color:btnColor}]}>Depositar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── AnimatedCard ─────────────────────────────────────────────────────────────
export const AnimatedCard = ({ children, delay=0, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(()=>{
    const t = setTimeout(()=>{
      Animated.timing(anim,{toValue:1,duration:380,easing:Easing.out(Easing.cubic),useNativeDriver:true}).start();
    }, delay);
    return ()=>clearTimeout(t);
  }, []);
  return (
    <Animated.View style={[style,{
      opacity:anim,
      transform:[{translateY:anim.interpolate({inputRange:[0,1],outputRange:[18,0]})}],
    }]}>
      {children}
    </Animated.View>
  );
};

// ─── AnimatedPressable ────────────────────────────────────────────────────────
export const AnimatedPressable = ({ onPress, style, children, disabled }) => (
  <TouchableOpacity onPress={onPress} style={style} disabled={disabled} activeOpacity={0.72}>
    {children}
  </TouchableOpacity>
);

// ─── Toast estilo iPhone ──────────────────────────────────────────────────────
export const Toast = ({ notif, onDismiss }) => {
  const ty=useRef(new Animated.Value(-120)).current;
  const opacity=useRef(new Animated.Value(0)).current;
  const scale=useRef(new Animated.Value(0.88)).current;
  const tx=useRef(new Animated.Value(0)).current;
  const gone=useRef(false);
  useEffect(()=>{
    Animated.parallel([
      Animated.spring(ty,    {toValue:0,useNativeDriver:true,damping:16,stiffness:240,mass:0.9}),
      Animated.spring(scale, {toValue:1,useNativeDriver:true,damping:18,stiffness:280}),
      Animated.timing(opacity,{toValue:1,useNativeDriver:true,duration:200,easing:Easing.out(Easing.quad)}),
    ]).start();
    const t=setTimeout(go,4000); return()=>clearTimeout(t);
  },[]);
  const go=()=>{
    if(gone.current) return; gone.current=true;
    Animated.parallel([
      Animated.timing(ty,    {toValue:-120,useNativeDriver:true,duration:320,easing:Easing.bezier(0.4,0,0.2,1)}),
      Animated.timing(opacity,{toValue:0,useNativeDriver:true,duration:260,easing:Easing.in(Easing.quad)}),
      Animated.timing(scale, {toValue:0.9,useNativeDriver:true,duration:280,easing:Easing.in(Easing.quad)}),
    ]).start(()=>onDismiss());
  };
  const pan=useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>true,
    onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dy)>3||Math.abs(g.dx)>3,
    onPanResponderMove:(_,g)=>{
      if(g.dy<0){ty.setValue(g.dy);opacity.setValue(Math.max(0,1+g.dy/70));}
      else{tx.setValue(g.dx);opacity.setValue(Math.max(0,1-Math.abs(g.dx)/120));}
    },
    onPanResponderRelease:(_,g)=>{
      if(g.dy<-36||Math.abs(g.dx)>80){go();}
      else{Animated.parallel([
        Animated.spring(ty,    {toValue:0,useNativeDriver:true,damping:18,stiffness:260}),
        Animated.spring(tx,    {toValue:0,useNativeDriver:true,damping:18,stiffness:260}),
        Animated.timing(opacity,{toValue:1,useNativeDriver:true,duration:100}),
      ]).start();}
    },
  })).current;
  return (
    <Animated.View {...pan.panHandlers} style={{transform:[{translateY:ty},{translateX:tx},{scale}],opacity}}>
      <View style={{marginHorizontal:14,backgroundColor:'rgba(250,252,255,0.98)',borderRadius:20,
        paddingHorizontal:14,paddingVertical:14,flexDirection:'row',alignItems:'center',gap:12,
        shadowColor:'#08316D',shadowOffset:{width:0,height:10},shadowOpacity:0.18,shadowRadius:28,elevation:16,
        borderWidth:1,borderColor:'rgba(8,49,109,0.08)'}}>
        <View style={{width:40,height:40,borderRadius:20,backgroundColor:notif.color??'#08316D',
          justifyContent:'center',alignItems:'center',
          shadowColor:notif.color??'#08316D',shadowOffset:{width:0,height:4},shadowOpacity:0.35,shadowRadius:8}}>
          <MaterialIcons name={notif.icon??'info'} size={20} color="#fff"/>
        </View>
        <View style={{flex:1}}>
          <Text style={{fontSize:13.5,fontWeight:'700',color:'#0F172A',letterSpacing:-0.2}}>{notif.title}</Text>
          {notif.sub?<Text style={{fontSize:12,color:'#64748B',marginTop:2}} numberOfLines={1}>{notif.sub}</Text>:null}
        </View>
        <TouchableOpacity onPress={go} hitSlop={{top:12,bottom:12,left:12,right:12}}>
          <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#F1F5F9',justifyContent:'center',alignItems:'center'}}>
            <MaterialIcons name="close" size={13} color="#94A3B8"/>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const ToastContainer = ({ toasts, onDismiss }) => {
  if(!toasts.length) return null;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent hardwareAccelerated onRequestClose={()=>{}}>
      <View pointerEvents="box-none" style={{position:'absolute',top:44,left:0,right:0,gap:6}}>
        {toasts.slice(0,3).map(n=>(
          <Toast key={n.id} notif={n} onDismiss={()=>onDismiss(n.id)}/>
        ))}
      </View>
    </Modal>
  );
};

// ─── DrawerMenu ───────────────────────────────────────────────────────────────
const DRAWER_ITEMS = [
  { id:'transactions', icon:'swap-horiz',     label:'Transferencias'   },
  { id:'loans',        icon:'attach-money',   label:'Préstamos'        },
  { id:'deposits',     icon:'arrow-downward', label:'Depósitos'        },
  { id:'withdrawals',  icon:'arrow-upward',   label:'Retiros'          },
  { id:'statements',   icon:'description',    label:'Estado de cuenta' },
];

export const DrawerMenu = ({ visible, onClose, onSelect }) => {
  const anim = useRef(new Animated.Value(-W * 0.78)).current;
  useEffect(()=>{
    Animated.timing(anim,{toValue:visible?0:-W*0.78,duration:260,easing:t=>t,useNativeDriver:false}).start();
  },[visible]);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={dr.overlay}>
        <TouchableOpacity style={dr.backdrop} activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[dr.panel,{transform:[{translateX:anim}]}]}>
          <View style={dr.hdr}>
            <View style={dr.closeRow}>
              <TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                <MaterialIcons name="close" size={22} color="rgba(255,255,255,0.7)"/>
              </TouchableOpacity>
            </View>
            <Image source={require('../../../../assets/LogoBancokinal.png')}
              style={dr.logoImg} resizeMode="contain"/>
          </View>
          <View style={dr.divider}/>
          <Text style={dr.section}>OPERACIONES</Text>
          {DRAWER_ITEMS.map(item=>(
            <TouchableOpacity key={item.id} style={dr.item}
              onPress={()=>{onClose();onSelect(item.id);}} activeOpacity={0.7}>
              <View style={dr.itemIcon}>
                <MaterialIcons name={item.icon} size={20} color="rgba(255,255,255,0.9)"/>
              </View>
              <Text style={dr.itemLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={18} color="rgba(255,255,255,0.4)"/>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
};
const dr = StyleSheet.create({
  overlay: {flex:1,flexDirection:'row'},
  backdrop:{flex:1,backgroundColor:'rgba(0,0,0,0.5)'},
  panel:   {width:W*0.78,backgroundColor:C.primary,paddingTop:52,paddingBottom:40},
  hdr:     {paddingHorizontal:SPACING.lg,paddingBottom:SPACING.lg},
  logoImg: {width:W*0.78-SPACING.lg*2,height:56,marginBottom:SPACING.md},
  closeRow:{flexDirection:'row',justifyContent:'flex-end',marginBottom:SPACING.sm},
  divider: {height:1,backgroundColor:'rgba(255,255,255,0.15)',marginHorizontal:SPACING.lg,marginBottom:SPACING.md},
  section: {fontSize:FONT_SIZE.xs,fontWeight:FONT_WEIGHT.semibold,color:'rgba(255,255,255,0.5)',
    paddingHorizontal:SPACING.lg,marginBottom:SPACING.sm,letterSpacing:0.8},
  item:    {flexDirection:'row',alignItems:'center',paddingHorizontal:SPACING.lg,paddingVertical:SPACING.md,gap:SPACING.md},
  itemIcon:{width:40,height:40,borderRadius:20,backgroundColor:'rgba(255,255,255,0.12)',justifyContent:'center',alignItems:'center'},
  itemLabel:{flex:1,fontSize:FONT_SIZE.md,color:'#fff',fontWeight:FONT_WEIGHT.medium},
});

// ─── TabBar ───────────────────────────────────────────────────────────────────
const CLIENT_TABS = [
  {id:'panel',    icon:'dashboard',       label:'Mi Panel BK'},
  {id:'accounts', icon:'account-balance', label:'Mis Cuentas'},
  {id:'cards',    icon:'credit-card',     label:'Tarjetas'   },
  {id:'profile',  icon:'person-outline',  label:'Perfil'     },
  {id:'menu',     icon:'menu',            label:'Menú'       },
];

const TabItem = ({ t, active, onSelect }) => {
  const anim=useRef(new Animated.Value(active?1:0)).current;
  useEffect(()=>{ Animated.spring(anim,{toValue:active?1:0,useNativeDriver:false,tension:80,friction:8}).start(); },[active]);
  const scale=anim.interpolate({inputRange:[0,1],outputRange:[1,1.18]});
  const top=anim.interpolate({inputRange:[0,1],outputRange:[0,-3]});
  return (
    <TouchableOpacity style={tb.btn} onPress={()=>onSelect(t.id)} activeOpacity={0.7}>
      <Animated.View style={{transform:[{scale}],marginTop:top}}>
        <MaterialIcons name={t.icon} size={24} color={active?C.primary:C.textMuted}/>
      </Animated.View>
      <Text style={[tb.lbl,active&&{color:C.primary,fontWeight:FONT_WEIGHT.semibold}]}>{t.label}</Text>
      {active&&<View style={tb.dot}/>}
    </TouchableOpacity>
  );
};
export const TabBar = ({ active, onSelect }) => (
  <View style={tb.bar}>
    {CLIENT_TABS.map(t=><TabItem key={t.id} t={t} active={active===t.id} onSelect={onSelect}/>)}
  </View>
);
const tb = StyleSheet.create({
  bar:{flexDirection:'row',backgroundColor:C.tab,borderTopWidth:1,borderTopColor:C.border,
    paddingBottom:Platform.OS==='ios'?18:8,paddingTop:8,...SHADOWS.md},
  btn:{flex:1,alignItems:'center',gap:2},
  dot:{width:4,height:4,borderRadius:2,backgroundColor:C.primary,marginTop:1},
  lbl:{fontSize:8,color:C.textMuted},
});

// ─── useF hook ────────────────────────────────────────────────────────────────
export const useF = (init) => {
  const [v, sv] = useState(init);
  return { v, set:(k,x)=>sv(p=>({...p,[k]:x})), reset:()=>sv(init) };
};