// src/features/admin/screens/AdminDashboard.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
  Platform, Animated, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import useAdmin from '../hooks/useAdmin.js';
import authClient from '../../../shared/api/authClient.js';
import userClient from '../../../shared/api/userClient.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProfileScreen from '../../profile/screens/ProfileScreen.jsx';
import { useAuthStore } from '../../../shared/store/authStore.js';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '../../../shared/constants/theme.js';
import { ENDPOINTS } from '../../../shared/constants/endpoints.js';

const { width: W } = Dimensions.get('window');
const fmt = (n) => new Intl.NumberFormat('es-GT', { style:'currency', currency:'GTQ' }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT') : '—';
const WEB = Platform.OS === 'web'
  ? { outline:'none', border:'none', backgroundColor:'transparent' }
  : { backgroundColor:'transparent' };

const C = {
  bg:'#F2F4F7', surface:'#FFFFFF', primary:'#08316D', primaryMid:'#0A4A9E',
  accent:'#00BCD4', text:'#0F172A', textSub:'#64748B', textMuted:'#94A3B8',
  border:'#E2E8F0', success:'#10B981', warning:'#F59E0B', error:'#EF4444',
};

// ─── Banner ───────────────────────────────────────────────────────────────────
const Banner = ({ msg, type, onClose }) => {
  if (!msg) return null;
  const isE = type === 'error';
  return (
    <View style={[bn.w,{borderLeftColor:isE?C.error:C.success,backgroundColor:isE?'#FEF2F2':'#F0FDF4'}]}>
      <MaterialIcons name={isE?'error-outline':'check-circle'} size={14} color={isE?C.error:C.success}/>
      <Text style={[bn.t,{color:isE?C.error:C.success}]}>{msg}</Text>
      <TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}>
        <MaterialIcons name="close" size={14} color={C.textMuted}/>
      </TouchableOpacity>
    </View>
  );
};
const bn = StyleSheet.create({
  w:{flexDirection:'row',alignItems:'center',gap:8,borderLeftWidth:3,borderRadius:8,padding:10,marginBottom:10},
  t:{flex:1,fontSize:12,lineHeight:17},
});

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const s = String(status ?? '').toLowerCase();
  const map = {
    activa:{bg:'#F0FDF4',c:C.success},activo:{bg:'#F0FDF4',c:C.success},
    inactiva:{bg:'#FEF2F2',c:C.error},inactivo:{bg:'#FEF2F2',c:C.error},
    bloqueada:{bg:'#FFFBEB',c:C.warning},bloqueado:{bg:'#FFFBEB',c:C.warning},
    pendiente:{bg:'#FFFBEB',c:C.warning},solicitado:{bg:'#EFF6FF',c:C.primaryMid},
    rechazado:{bg:'#FEF2F2',c:C.error},exitosa:{bg:'#F0FDF4',c:C.success},
    user_role:{bg:'#EFF6FF',c:C.primaryMid},admin_role:{bg:'#FFF7ED',c:C.warning},
    debito:{bg:'#EFF6FF',c:C.primaryMid},credito:{bg:'#F5F3FF',c:'#7C3AED'},
    ahorro:{bg:'#F0FDF4',c:C.success},monetaria:{bg:'#EFF6FF',c:C.primaryMid},
    nomina:{bg:'#FFF7ED',c:C.warning},pagado:{bg:'#F0FDF4',c:C.success},
    transferencia:{bg:'#EFF6FF',c:C.primaryMid},
  };
  const cfg = map[s] ?? {bg:C.bg,c:C.textSub};
  return (
    <View style={[bdg.p,{backgroundColor:cfg.bg}]}>
      <Text style={[bdg.t,{color:cfg.c}]}>{status}</Text>
    </View>
  );
};
const bdg = StyleSheet.create({
  p:{paddingHorizontal:7,paddingVertical:2,borderRadius:99,alignSelf:'flex-start'},
  t:{fontSize:9,fontWeight:FONT_WEIGHT.semibold,textTransform:'capitalize'},
});

// ─── Input ────────────────────────────────────────────────────────────────────
const LInput = ({ label, value, onChangeText, placeholder, secure, numeric, required, multiline }) => {
  const [focused,setFocused] = useState(false);
  const [hidden, setHidden]  = useState(!!secure);
  return (
    <View style={{marginBottom:12}}>
      {label && <Text style={li.lbl}>{label}{required&&<Text style={{color:C.accent}}> *</Text>}</Text>}
      <View style={[li.row, focused&&{borderColor:C.primaryMid}, multiline&&{alignItems:'flex-start',minHeight:64}]}>
        <TextInput
          style={[li.inp, WEB, multiline&&{minHeight:54,textAlignVertical:'top'}]}
          value={value} onChangeText={onChangeText}
          placeholder={placeholder??label??''} placeholderTextColor={C.textMuted}
          keyboardType={numeric?'decimal-pad':'default'}
          secureTextEntry={hidden} autoCapitalize="none" autoCorrect={false}
          multiline={!!multiline} blurOnSubmit={!multiline}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          showSoftInputOnFocus={false}
        />
        {secure && (
          <TouchableOpacity onPress={()=>setHidden(h=>!h)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <MaterialIcons name={hidden?'visibility-off':'visibility'} size={16} color={C.textMuted}/>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
const li = StyleSheet.create({
  lbl:{fontSize:10,color:C.textSub,fontWeight:FONT_WEIGHT.semibold,marginBottom:5,
    textTransform:'uppercase',letterSpacing:0.4},
  row:{flexDirection:'row',alignItems:'center',borderWidth:1.5,borderColor:C.border,
    borderRadius:BORDER_RADIUS.md,paddingHorizontal:12,paddingVertical:8,
    backgroundColor:C.surface,gap:8},
  inp:{flex:1,fontSize:13,color:C.text},
});

// ─── Select ───────────────────────────────────────────────────────────────────
const LSelect = ({ label, value, options, onSelect, required }) => {
  const [open,setOpen] = useState(false);
  const found = options.find(o=>(o.v??o)===value);
  const lbl = found?(found.l??found):'Seleccionar…';
  return (
    <View style={{marginBottom:12}}>
      {label&&<Text style={li.lbl}>{label}{required&&<Text style={{color:C.accent}}> *</Text>}</Text>}
      <TouchableOpacity style={[li.row,{justifyContent:'space-between'}]}
        onPress={()=>setOpen(true)} activeOpacity={0.8}>
        <Text style={{flex:1,fontSize:13,color:value?C.text:C.textMuted}}>{lbl}</Text>
        <MaterialIcons name="expand-more" size={18} color={C.textMuted}/>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={()=>setOpen(false)}>
        <TouchableOpacity style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'}}
          activeOpacity={1} onPress={()=>setOpen(false)}>
          <View style={{backgroundColor:C.surface,borderTopLeftRadius:20,borderTopRightRadius:20,
            padding:20,maxHeight:'60%'}}>
            {label&&<Text style={{fontSize:15,fontWeight:FONT_WEIGHT.bold,color:C.text,marginBottom:14}}>{label}</Text>}
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map(o=>{
                const v=o.v??o; const l=o.l??o;
                return (
                  <TouchableOpacity key={v}
                    style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',
                      paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border}}
                    onPress={()=>{onSelect(v);setOpen(false);}}>
                    <Text style={{fontSize:13,color:value===v?C.primaryMid:C.text,
                      fontWeight:value===v?FONT_WEIGHT.semibold:FONT_WEIGHT.regular}}>{l}</Text>
                    {value===v&&<MaterialIcons name="check" size={15} color={C.primaryMid}/>}
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

// ─── Button ───────────────────────────────────────────────────────────────────
const PBtn = ({ title, onPress, loading, ghost, icon, style }) => (
  <TouchableOpacity style={[pb.btn,ghost&&pb.ghost,style]} onPress={onPress}
    disabled={loading} activeOpacity={0.85}>
    {loading
      ? <ActivityIndicator color={ghost?C.primary:'#fff'} size="small"/>
      : <>{icon&&<MaterialIcons name={icon} size={16} color={ghost?C.primary:'#fff'}/>}
          <Text style={[pb.lbl,ghost&&{color:C.primary}]}>{title}</Text></>
    }
  </TouchableOpacity>
);
const pb = StyleSheet.create({
  btn:{height:38,borderRadius:BORDER_RADIUS.full,backgroundColor:C.primary,
    justifyContent:'center',alignItems:'center',flexDirection:'row',gap:5,paddingHorizontal:14},
  ghost:{backgroundColor:'transparent',borderWidth:1.5,borderColor:C.primary},
  lbl:{fontSize:12,fontWeight:FONT_WEIGHT.bold,color:'#fff'},
});

// ─── Modal ────────────────────────────────────────────────────────────────────
const LModal = ({ visible, title, onClose, children }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'}}>
      <View style={{backgroundColor:C.surface,borderTopLeftRadius:22,borderTopRightRadius:22,
        padding:18,maxHeight:'92%'}}>
        <View style={{width:34,height:4,borderRadius:2,backgroundColor:C.border,
          alignSelf:'center',marginBottom:12}}/>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <Text style={{fontSize:16,fontWeight:FONT_WEIGHT.bold,color:C.text}}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}>
            <MaterialIcons name="close" size={20} color={C.textSub}/>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
          <View style={{height:20}}/>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── useF ─────────────────────────────────────────────────────────────────────
const useF = (init) => {
  const [v,sv] = useState(init);
  return {v, set:(k,x)=>sv(p=>({...p,[k]:x})), reset:()=>sv(init)};
};

// ─── Tabla horizontal reutilizable ────────────────────────────────────────────
const TD = ({ w=110, children, color, bold, actions }) => (
  <View
    style={{width:w,paddingHorizontal:6,justifyContent:'center',minHeight:44}}
    // Para columnas de acciones en nativo: evitar que el ScrollView capture el toque
    onStartShouldSetResponder={actions ? ()=>false : undefined}
  >
    {typeof children==='string'||typeof children==='number'
      ? <Text style={{fontSize:FONT_SIZE.xs,color:color??C.text,
          fontWeight:bold?FONT_WEIGHT.semibold:FONT_WEIGHT.regular,
          fontFamily:undefined}} numberOfLines={2}>{children}</Text>
      : children
    }
  </View>
);

const HTable = ({ cols, data:rows, renderRow, emptyMsg='Sin registros', loading }) => {
  const minW = cols.reduce((s,c)=>s+(c.w??110),0);
  return (
    <View style={ht.card}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        directionalLockEnabled={false}
        keyboardShouldPersistTaps="always"
        disableScrollViewPanResponder={false}
        contentContainerStyle={{minWidth:minW}}
        style={Platform.OS==='web'
          ? {overflowX:'auto',overflowY:'visible'}
          : {}}
      >
        <View style={{minWidth:minW}}>
          {/* Header */}
          <View style={ht.thead}>
            {cols.map(c=>(
              <Text key={c.key} style={[ht.th,{width:c.w??110}]}>{c.label}</Text>
            ))}
          </View>
          {/* Rows */}
          {loading
            ? <View style={ht.empty}><ActivityIndicator color={C.primary}/></View>
            : rows.length===0
              ? <View style={ht.empty}>
                  <MaterialIcons name="inbox" size={28} color={C.textMuted}/>
                  <Text style={{color:C.textMuted,fontSize:12,marginTop:6}}>{emptyMsg}</Text>
                </View>
              : rows.map((row,i)=>(
                  <View key={row._id??row.id??row.accountNumber??i}
                    style={[ht.tr,i%2===1&&{backgroundColor:'#FAFBFC'}]}>
                    {renderRow(row)}
                  </View>
                ))
          }
        </View>
      </ScrollView>
    </View>
  );
};
const ht = StyleSheet.create({
  card:{backgroundColor:C.surface,borderRadius:12,overflow:'hidden',borderWidth:1,borderColor:C.border},
  thead:{flexDirection:'row',paddingVertical:8,backgroundColor:'#F8FAFC',
    borderBottomWidth:1,borderBottomColor:C.border},
  th:{fontSize:FONT_SIZE.xs-2,fontWeight:FONT_WEIGHT.bold,color:C.primary,
    textTransform:'uppercase',letterSpacing:0.3,paddingHorizontal:6},
  tr:{flexDirection:'row',paddingVertical:4,borderBottomWidth:1,borderBottomColor:C.border,
    alignItems:'center',minHeight:44},
  empty:{padding:28,alignItems:'center',gap:6},
});

// ─── Drawer ───────────────────────────────────────────────────────────────────
const DRAWER_ITEMS = [
  {id:'tx',          icon:'swap-horiz',      label:'Transacciones'},
  {id:'loans',       icon:'attach-money',    label:'Préstamos'},
  {id:'deposits',    icon:'arrow-downward',  label:'Depósitos'},
  {id:'withdrawals', icon:'arrow-upward',    label:'Retiros'},
  {id:'statements',  icon:'description',     label:'Estados de cuenta'},
  {id:'coins',       icon:'monetization-on', label:'Monedas'},
  {id:'locks',       icon:'lock',            label:'Cuentas bloqueadas'},
  {id:'services',    icon:'settings',        label:'Servicios'},
];

const DrawerMenu = ({ visible, onClose, onSelect }) => {
  const anim = useRef(new Animated.Value(-W*0.78)).current;
  useEffect(()=>{
    Animated.timing(anim,{toValue:visible?0:-W*0.78,
      duration:250,easing:t=>t,useNativeDriver:false}).start();
  },[visible]);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{flex:1,flexDirection:'row'}}>
        <TouchableOpacity style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)'}}
          activeOpacity={1} onPress={onClose}/>
        <Animated.View style={[drw.panel,{transform:[{translateX:anim}]}]}>
          {/* Logo azul */}
          <View style={drw.hdr}>
            <View style={drw.logoBg}>
              <Image source={require('../../../../assets/LogoBancokinal.png')}
                style={drw.logoImg} resizeMode="contain"/>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.7)"/>
            </TouchableOpacity>
          </View>
          <View style={{height:1,backgroundColor:"rgba(255,255,255,0.15)",marginHorizontal:16,marginBottom:10}}/>
          <Text style={drw.section}>GESTIÓN</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {DRAWER_ITEMS.map(item=>(
              <TouchableOpacity key={item.id} style={drw.item}
                onPress={()=>{onClose();onSelect(item.id);}} activeOpacity={0.7}>
                <View style={drw.itemIcon}>
                  <MaterialIcons name={item.icon} size={18} color="rgba(255,255,255,0.9)"/>
                </View>
                <Text style={drw.itemLabel}>{item.label}</Text>
                <MaterialIcons name="chevron-right" size={16} color="rgba(255,255,255,0.4)"/>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {/* Cerrar sesión */}
          <View style={{padding:16,borderTopWidth:1,borderTopColor:'rgba(255,255,255,0.15)'}}>
            <TouchableOpacity style={drw.logoutBtn}
              onPress={()=>{onClose();onSelect('logout');}} activeOpacity={0.8}>
              <MaterialIcons name="logout" size={18} color="#FF6B6B"/>
              <Text style={drw.logoutLabel}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
const drw = StyleSheet.create({
  panel:     {width:W*0.78,backgroundColor:C.primary,paddingTop:48},
  hdr:       {flexDirection:'row',alignItems:'center',justifyContent:'space-between',
    paddingHorizontal:16,paddingBottom:14},
  logoBg:    {flex:1,backgroundColor:C.primary,borderRadius:8,padding:8,marginRight:10,
    alignItems:'center',justifyContent:'center',
    borderWidth:1.5,borderColor:'rgba(255,255,255,0.25)'},
  logoImg:   {width:'100%',height:36},
  section:   {fontSize:9,fontWeight:FONT_WEIGHT.semibold,color:'rgba(255,255,255,0.55)',
    paddingHorizontal:16,marginBottom:6,letterSpacing:0.8},
  item:      {flexDirection:'row',alignItems:'center',paddingHorizontal:16,
    paddingVertical:12,gap:12},
  itemIcon:  {width:38,height:38,borderRadius:19,backgroundColor:'rgba(255,255,255,0.15)',
    justifyContent:'center',alignItems:'center'},
  itemLabel: {flex:1,fontSize:13,color:'#fff',fontWeight:FONT_WEIGHT.medium},
  logoutBtn: {flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,
    paddingHorizontal:4},
  logoutLabel:{flex:1,fontSize:13,color:'#FF6B6B',fontWeight:FONT_WEIGHT.semibold},
});

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS = [
  {id:'panel',   icon:'dashboard',       label:'Panel'},
  {id:'users',   icon:'people',          label:'Usuarios'},
  {id:'accounts',icon:'account-balance', label:'Cuentas'},
  {id:'cards',   icon:'credit-card',     label:'Tarjetas'},
  {id:'profile', icon:'person-outline',  label:'Perfil'},
  {id:'menu',    icon:'menu',            label:'Menú'},
];

const TabItem = ({t, active, onSelect}) => {
  const anim = useRef(new Animated.Value(active?1:0)).current;
  useEffect(()=>{
    Animated.spring(anim,{toValue:active?1:0,
      useNativeDriver:false,tension:80,friction:8}).start();
  },[active]);
  const scale = anim.interpolate({inputRange:[0,1],outputRange:[1,1.18]});
  const top   = anim.interpolate({inputRange:[0,1],outputRange:[0,-3]});
  return (
    <TouchableOpacity style={tb.btn} onPress={()=>onSelect(t.id)} activeOpacity={0.7}>
      <Animated.View style={{transform:[{scale}],marginTop:top}}>
        <MaterialIcons name={t.icon} size={24} color={active?C.primary:C.textMuted}/>
      </Animated.View>
      <Text style={[tb.lbl,active&&{color:C.primary,fontWeight:FONT_WEIGHT.semibold}]}>
        {t.label}
      </Text>
      {active && <View style={tb.dot}/>}
    </TouchableOpacity>
  );
};

const TabBar = ({active,onSelect}) => (
  <View style={tb.bar}>
    {TABS.map(t=><TabItem key={t.id} t={t} active={active===t.id} onSelect={onSelect}/>)}
  </View>
);
const tb = StyleSheet.create({
  bar:{flexDirection:'row',backgroundColor:C.surface,borderTopWidth:1,borderTopColor:C.border,
    paddingBottom:Platform.OS==='ios'?18:8,paddingTop:8},
  btn:{flex:1,alignItems:'center',gap:3},
  lbl:{fontSize:9,color:C.textMuted},
  dot:{width:4,height:4,borderRadius:2,backgroundColor:C.primary,marginTop:1},
});

// ─── Notificaciones ───────────────────────────────────────────────────────────
const NotifPanel = ({ visible, onClose, notifs, onClear }) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'}}>
      <View style={{backgroundColor:C.surface,borderTopLeftRadius:22,borderTopRightRadius:22,
        maxHeight:'75%',paddingHorizontal:18}}>
        <View style={{width:34,height:4,borderRadius:2,backgroundColor:C.border,
          alignSelf:'center',marginTop:12,marginBottom:8}}/>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',
          paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border,marginBottom:6}}>
          <Text style={{fontSize:16,fontWeight:FONT_WEIGHT.bold,color:C.text}}>Notificaciones</Text>
          <View style={{flexDirection:'row',gap:12}}>
            {notifs.length>0&&(
              <TouchableOpacity onPress={onClear}>
                <Text style={{fontSize:11,color:C.primaryMid,fontWeight:FONT_WEIGHT.medium}}>Limpiar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name="close" size={20} color={C.textSub}/>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {notifs.length===0
            ? <View style={{alignItems:'center',paddingVertical:36,gap:10}}>
                <MaterialIcons name="notifications-none" size={44} color={C.textMuted}/>
                <Text style={{fontSize:14,color:C.textSub,fontWeight:FONT_WEIGHT.semibold}}>Sin notificaciones</Text>
                <Text style={{fontSize:12,color:C.textMuted,textAlign:'center'}}>
                  Los registros de usuarios, cuentas y operaciones aparecerán aquí
                </Text>
              </View>
            : notifs.map(n=>(
                <View key={n.id} style={{flexDirection:'row',alignItems:'flex-start',
                  paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border,gap:12}}>
                  <View style={{width:38,height:38,borderRadius:19,backgroundColor:n.bg,
                    justifyContent:'center',alignItems:'center',flexShrink:0}}>
                    <MaterialIcons name={n.icon} size={18} color={n.color}/>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:13,fontWeight:FONT_WEIGHT.semibold,color:C.text}}>{n.title}</Text>
                    <Text style={{fontSize:11,color:C.textSub,marginTop:2}}>{n.sub}</Text>
                    <Text style={{fontSize:10,color:C.textMuted,marginTop:2}}>{n.date}</Text>
                  </View>
                </View>
              ))
          }
          <View style={{height:28}}/>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── Panel de acciones (ícono) ────────────────────────────────────────────────
const IBtn = ({ icon, color, onPress }) => {
  const handlePress = (e) => {
    // En web, detener propagación para que el click no lo capture el ScrollView
    if (Platform.OS === 'web' && e?.stopPropagation) e.stopPropagation();
    if (onPress) onPress();
  };
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.6}
      hitSlop={{top:10,bottom:10,left:10,right:10}}
      style={sc2.iBtn}
      // En web esto es clave para que el click llegue al botón
      {...(Platform.OS === 'web' ? {
        onClick: (e) => { e.stopPropagation(); if(onPress) onPress(); }
      } : {})}
    >
      <MaterialIcons name={icon} size={15} color={color}/>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ─── UsersScreen — componente EXTERNO (nunca dentro del render) ──────────────
// Razón: si se define dentro, React lo recrea en cada render del padre,
// desmonta/monta en cada keystroke y los botones pierden contexto.
const sc = StyleSheet.create({
  appBar:      {flexDirection:'row',alignItems:'center',gap:10,
    paddingHorizontal:16,paddingVertical:10,backgroundColor:C.primary,
    height:60},
  appBarLogoBg:{backgroundColor:C.primary,borderRadius:8,
    paddingHorizontal:10,paddingVertical:5,justifyContent:'center',
    borderWidth:1.5,borderColor:'rgba(255,255,255,0.25)'},
  appBarLogoImg:{height:30,width:140},
  notifBtn:    {width:38,height:38,borderRadius:19,backgroundColor:'rgba(255,255,255,0.15)',
    justifyContent:'center',alignItems:'center',position:'relative'},
  notifDot:    {position:'absolute',top:7,right:7,width:8,height:8,
    borderRadius:4,backgroundColor:'#FF4444',borderWidth:1.5,borderColor:C.primary},
  userBadge:   {flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(255,255,255,0.15)',
    borderRadius:BORDER_RADIUS.full,paddingHorizontal:10,paddingVertical:4},

  pageHeader:  {flexDirection:'row',justifyContent:'space-between',alignItems:'center',
    paddingHorizontal:16,paddingTop:14,paddingBottom:10},
  pageTitle:   {fontSize:20,fontWeight:FONT_WEIGHT.bold,color:C.primary},
  pageSub:     {fontSize:11,color:C.textSub,marginTop:2},
  sectionTitle:{fontSize:13,fontWeight:FONT_WEIGHT.bold,color:C.text},

  statsGrid:   {flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},
  statCard:    {backgroundColor:C.surface,borderRadius:10,padding:12,
    width:'48%',gap:6,borderWidth:1,borderColor:C.border},
  statIcon:    {width:32,height:32,borderRadius:16,justifyContent:'center',alignItems:'center'},
  statVal:     {fontSize:20,fontWeight:FONT_WEIGHT.bold},
  statLbl:     {fontSize:8,color:C.textMuted,letterSpacing:0.3},

  miniStat:    {backgroundColor:C.surface,borderRadius:8,padding:10,
    alignItems:'center',gap:3,borderWidth:1,borderColor:C.border},
  miniVal:     {fontSize:16,fontWeight:FONT_WEIGHT.bold},
  miniLbl:     {fontSize:9,color:C.textMuted},

  searchBox:   {flexDirection:'row',alignItems:'center',gap:8,backgroundColor:C.surface,
    borderRadius:8,paddingHorizontal:12,paddingVertical:8,
    borderWidth:1,borderColor:C.border},

  avatar:      {width:32,height:32,borderRadius:16,backgroundColor:'#EFF6FF',
    justifyContent:'center',alignItems:'center',flexShrink:0},
  avatarTxt:   {fontSize:12,fontWeight:FONT_WEIGHT.bold,color:C.primaryMid},
});

const sc2 = StyleSheet.create({
  iBtn:{
    width:32, height:32, borderRadius:8,
    justifyContent:'center', alignItems:'center',
    backgroundColor:'#F1F5F9',
    borderWidth:1, borderColor:C.border,
    // En web, cursor pointer
    ...(Platform.OS==='web' ? {cursor:'pointer'} : {}),
  },
});


// Correo del administrador principal — único con permisos totales
const SUPER_ADMIN_EMAIL = 'proyectobancario3@gmail.com';

// Verifica si un objeto usuario es el superadmin
// Compara email en todos los campos posibles que puede devolver el backend
const checkIsSuperAdmin = (user) => {
  if (!user) return false;
  const email = (
    user.email ??
    user.correo ??
    user.emailAddress ??
    user.mail ??
    ''
  ).toLowerCase().trim();
  return email === SUPER_ADMIN_EMAIL.toLowerCase();
};

function UsersScreen({ users, loading, fetchAll, onChangeRole, onAddNotif, currentUser }) {
  const [search,      setSearch]      = useState('');
  const [infoUser,    setInfoUser]    = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [busy,        setBusy]        = useState(false);
  const [noPermModal, setNoPermModal] = useState(null);

  // ¿Es el admin logueado el administrador principal?
  const isSuperAdmin  = checkIsSuperAdmin(currentUser);
  const currentUserId = currentUser?._uid ?? currentUser?.id ?? currentUser?._id ?? currentUser?.userId ?? '';

  const filtered = search.trim()
    ? users.filter(u =>
        `${u.name??''} ${u.surname??''} ${u.username??''} ${u.email??''}`
          .toLowerCase().includes(search.toLowerCase()))
    : users;

  const doRoleChange = async () => {
    if (!confirmUser) return;
    setBusy(true);
    const { userId, nuevoRol, fullName, isAdmin } = confirmUser;
    const r = await onChangeRole(userId, nuevoRol);
    setBusy(false);
    setConfirmUser(null);
    if (r?.success) {
      onAddNotif({
        icon:  isAdmin ? 'person' : 'admin-panel-settings',
        color: isAdmin ? C.success : C.warning,
        bg:    isAdmin ? '#F0FDF4' : '#FFF7ED',
        title: 'Rol actualizado',
        sub:   `${fullName} ahora es ${isAdmin ? 'Usuario' : 'Administrador'}`,
      });
    }
  };

  return (
    <View style={{flex:1}}>
      <View style={sc.pageHeader}>
        <View>
          <Text style={sc.pageTitle}>Usuarios registrados</Text>
          <Text style={sc.pageSub}>Gestión y control de acceso</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{padding:16,paddingBottom:40}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>

        <View style={[sc.searchBox,{marginBottom:12}]}>
          <MaterialIcons name="search" size={16} color={C.textMuted}/>
          <TextInput
            style={[{flex:1,fontSize:12,color:C.text},WEB]}
            value={search} onChangeText={setSearch}
            placeholder="Buscar nombre, usuario, correo…"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none" autoCorrect={false}/>
          {search.length > 0 && (
            <TouchableOpacity onPress={()=>setSearch('')}
              hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name="close" size={14} color={C.textMuted}/>
            </TouchableOpacity>
          )}
        </View>

        <Text style={{color:C.textSub,fontSize:11,marginBottom:10}}>
          Total: <Text style={{color:C.text,fontWeight:FONT_WEIGHT.bold}}>{users.length}</Text> usuarios
        </Text>

        <HTable
          loading={loading && !users.length}
          emptyMsg="No se encontraron usuarios"
          cols={[
            {key:'usr',  label:'Usuario',  w:190},
            {key:'email',label:'Correo',   w:200},
            {key:'phone',label:'Teléfono', w:110},
            {key:'role', label:'Rol',      w:120},
            {key:'st',   label:'Estado',   w:90},
            {key:'act',  label:'Acciones', w:130},
          ]}
          data={filtered}
          renderRow={u => {
            const initials = `${u.name?.[0]??''}${u.surname?.[0]??''}`.toUpperCase()
              || u.username?.[0]?.toUpperCase() || '?';
            const fullName = `${u.name??''} ${u.surname??''}`.trim() || u.username || '—';
            const isAdmin  = u.role === 'ADMIN_ROLE';
            const userId   = u._uid ?? u.id ?? u._id ?? u.Id ?? '';
            return (<>
              <TD w={190}>
                <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
                  <View style={sc.avatar}><Text style={sc.avatarTxt}>{initials}</Text></View>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:11,color:C.text,fontWeight:FONT_WEIGHT.semibold}} numberOfLines={1}>{fullName}</Text>
                    <Text style={{fontSize:10,color:C.textMuted}} numberOfLines={1}>@{u.username}</Text>
                  </View>
                </View>
              </TD>
              <TD w={200} color={C.textSub}>{u.email??'—'}</TD>
              <TD w={110} color={C.textSub}>{u.phone??'—'}</TD>
              <TD w={120}><Badge status={u.role??'—'}/></TD>
              <TD w={90}><Badge status={u.isActive===false?'inactivo':'activo'}/></TD>
              <TD w={130}>
                <View style={{flexDirection:'row',gap:6}}>
                  {/* Botón info — siempre visible para todos */}
                  <IBtn icon="info-outline" color={C.primaryMid}
                    onPress={()=>setInfoUser({userId,fullName,u})}/>
                  {/* Botón cambio de rol — visible siempre excepto en la propia fila */}
                  {userId !== currentUserId && (
                    <IBtn
                      icon={isAdmin ? 'person-remove' : 'admin-panel-settings'}
                      color={isAdmin ? C.error : C.warning}
                      onPress={()=>{
                        const targetIsSuperAdmin = checkIsSuperAdmin(u);
                        // ÚNICA restricción: nadie puede modificar al admin principal
                        if (targetIsSuperAdmin) {
                          setNoPermModal('No es posible modificar al Administrador Principal del sistema.');
                          return;
                        }
                        // Cualquier admin puede cambiar roles de otros usuarios
                        setConfirmUser({userId,fullName,isAdmin,nuevoRol:isAdmin?'USER_ROLE':'ADMIN_ROLE'});
                      }}/>
                  )}
                </View>
              </TD>
            </>);
          }}
        />
      </ScrollView>

      {/* Modal detalle usuario */}
      <Modal visible={!!infoUser} transparent animationType="fade" onRequestClose={()=>setInfoUser(null)}>
        <TouchableOpacity style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',alignItems:'center'}}
          activeOpacity={1} onPress={()=>setInfoUser(null)}>
          <View style={{backgroundColor:C.surface,borderRadius:16,padding:24,width:'85%',maxWidth:380}}>
            <Text style={{fontSize:16,fontWeight:FONT_WEIGHT.bold,color:C.primary,marginBottom:16}}>
              {infoUser?.fullName}
            </Text>
            {infoUser?.u && [
              {icon:'person',      label:'Usuario',   val:`@${infoUser.u.username}`},
              {icon:'email',       label:'Correo',    val:infoUser.u.email??'—'},
              {icon:'phone',       label:'Teléfono',  val:infoUser.u.phone??'—'},
              {icon:'badge',       label:'Rol',       val:infoUser.u.role??'—'},
              {icon:'circle',      label:'Estado',    val:infoUser.u.isActive===false?'Inactivo':'Activo'},
              {icon:'fingerprint', label:'ID',        val:infoUser.userId||'—'},
            ].map((row,i)=>(
              <View key={i} style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:10}}>
                <MaterialIcons name={row.icon} size={16} color={C.textSub}/>
                <Text style={{fontSize:12,color:C.textSub,width:70}}>{row.label}</Text>
                <Text style={{flex:1,fontSize:12,color:C.text,fontWeight:FONT_WEIGHT.medium}}>{row.val}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={{marginTop:8,backgroundColor:C.primary,borderRadius:8,padding:12,alignItems:'center'}}
              onPress={()=>setInfoUser(null)}>
              <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:13}}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal confirmar cambio de rol */}
      <Modal visible={!!confirmUser} transparent animationType="fade" onRequestClose={()=>setConfirmUser(null)}>
        <TouchableOpacity style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',alignItems:'center'}}
          activeOpacity={1} onPress={()=>!busy&&setConfirmUser(null)}>
          <View style={{backgroundColor:C.surface,borderRadius:16,padding:24,width:'85%',maxWidth:380}}>
            <Text style={{fontSize:16,fontWeight:FONT_WEIGHT.bold,color:C.text,marginBottom:10}}>
              {confirmUser?.isAdmin ? 'Quitar Administrador' : 'Hacer Administrador'}
            </Text>
            <Text style={{fontSize:13,color:C.textSub,marginBottom:20,lineHeight:20}}>
              {confirmUser?.isAdmin
                ? `¿Quitar el rol de Admin a ${confirmUser?.fullName}? Pasará a ser usuario normal.`
                : `¿Convertir a ${confirmUser?.fullName} en Administrador? Tendrá acceso completo al panel.`}
            </Text>
            <View style={{flexDirection:'row',gap:10}}>
              <TouchableOpacity
                style={{flex:1,borderRadius:8,padding:12,alignItems:'center',borderWidth:1.5,borderColor:C.border}}
                onPress={()=>setConfirmUser(null)} disabled={busy}>
                <Text style={{color:C.textSub,fontWeight:FONT_WEIGHT.semibold,fontSize:13}}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{flex:1,borderRadius:8,padding:12,alignItems:'center',
                  backgroundColor:confirmUser?.isAdmin?C.error:C.warning}}
                onPress={doRoleChange} disabled={busy}>
                {busy
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:13}}>Confirmar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal advertencia sin permisos */}
      <Modal visible={!!noPermModal} transparent animationType="fade"
        onRequestClose={()=>setNoPermModal(null)}>
        <TouchableOpacity
          style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',alignItems:'center'}}
          activeOpacity={1} onPress={()=>setNoPermModal(null)}>
          <View style={{backgroundColor:C.surface,borderRadius:16,padding:24,width:'85%',maxWidth:360,alignItems:'center'}}>
            <View style={{width:52,height:52,borderRadius:26,backgroundColor:'#FEF2F2',
              justifyContent:'center',alignItems:'center',marginBottom:14}}>
              <MaterialIcons name="block" size={26} color={C.error}/>
            </View>
            <Text style={{fontSize:15,fontWeight:FONT_WEIGHT.bold,color:C.text,marginBottom:8,textAlign:'center'}}>
              Sin permisos
            </Text>
            <Text style={{fontSize:13,color:C.textSub,textAlign:'center',lineHeight:20,marginBottom:20}}>
              {noPermModal}
            </Text>
            <TouchableOpacity
              style={{backgroundColor:C.primary,borderRadius:8,paddingVertical:11,
                paddingHorizontal:32,alignItems:'center'}}
              onPress={()=>setNoPermModal(null)}>
              <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:13}}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}


export default function AdminDashboard({ logout }) {
  const admin = useAdmin();
  const { data, loading, submitting, error, success, clearMsg, fetchAll } = admin;
  const { users=[], accounts=[], cards=[], loans=[], transactions=[],
    coins=[], locks=[], services=[], deposits=[], statements=[] } = data;
  const storeUser    = useAuthStore(s=>s.user);
  const storeRole    = useAuthStore(s=>s.role);
  const updateUser   = useAuthStore(s=>s.updateUser);

  // Enriquecer el usuario con datos del perfil (incluye email que puede faltar en el store)
  useEffect(()=>{
    const loadProfile = async () => {
      try {
        const r = await authClient.get(ENDPOINTS.AUTH.PROFILE);
        const profile = r.data?.user ?? r.data?.profile ?? r.data;
        if (profile && updateUser) updateUser(profile);
      } catch {}
    };
    loadProfile();
  }, []);

  const [tab,      setTab]      = useState('panel');
  const [drawer,   setDrawer]   = useState(false);
  const [modal,    setModal]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [accModal,  setAccModal]  = useState(null);
  const [accBusy,   setAccBusy]   = useState(false);
  const [cardModal, setCardModal] = useState(null);
  const [cardBusy,  setCardBusy]  = useState(false);
  const [loanEdit,  setLoanEdit]  = useState(null); // préstamo siendo editado
  const [notifOpen,setNotifOpen]= useState(false);
  const [notifs,   setNotifs]   = useState([]);

  const addNotif = useCallback(({icon,color,bg,title,sub})=>{
    setNotifs(prev=>[{
      id:Date.now(), icon, color, bg, title, sub,
      date: new Date().toLocaleString('es-GT'),
    },...prev].slice(0,50));
  },[]);

  // Formularios exactos del Postman
  const today = new Date().toISOString().split('T')[0];
  const accF  = useF({userId:'',accountType:'ahorro',balance:'5000',
    openingDate:today,status:'activa',dailyWithdrawalLimit:'1000',
    annualInterestRate:'4.5',currencyCode:'GTQ',dpi:'',address:'',
    phone:'',jobName:'',monthlyIncome:''});
  const cardF = useF({userId:'',cardType:'debito',networkBrand:'mastercard',cvv:'',
    availableBalance:'0',expirationDate:'2028-12-31',pin:''});
  const loanF = useF({userId:'',accountNumber:'',requestedAmount:'',
    approvedAmount:'',interestRate:'',termMonths:'',monthlyPayment:'',
    outstandingBalance:'',status:'solicitado',loanPurpose:'',
    requestDate:today,approvalDate:today,disbursementDate:today,approvedByUserId:''});
  const coinF = useF({code:'',name:'',symbol:'',exchangeRate:'1',baseCurrency:'false',status:'activa'});
  const lockF = useF({accountId:'',userId:'',lockReason:'seguridad',description:'',
    lockDate:today,unlockDate:'',lockedBy:'',status:'bloqueado',automatic:'false',failedAttempts:'0'});
  const depF  = useF({accountNumber:'',amount:'',currencyCode:'GTQ',description:''});

  useEffect(()=>{ fetchAll(); },[]);

  // Notif automáticas al cargar datos la primera vez
  const notifSent = useRef(false);
  useEffect(()=>{
    if (notifSent.current || users.length===0) return;
    notifSent.current = true;
    if (users.length>0) addNotif({icon:'people',color:'#7C3AED',bg:'#F5F3FF',
      title:`${users.length} usuarios registrados`,sub:'Sistema cargado correctamente'});
    if (accounts.length>0) addNotif({icon:'account-balance',color:C.success,bg:'#F0FDF4',
      title:`${accounts.length} cuentas activas`,sub:`Balance total: ${fmt(accounts.reduce((s,a)=>s+(a.balance??0),0))}`});
  },[users.length, accounts.length]);

  const totalBalance   = accounts.reduce((s,a)=>s+(a.balance??0),0);
  const activeAccounts = accounts.filter(a=>(a._displayStatus??a.status)==='activa').length;
  const activeLoans    = loans.filter(l=>['activo','solicitado'].includes(l.status)).length;
  const lastAccounts   = [...accounts]
    .sort((a,b)=>new Date(b.openingDate??b.createdAt??0)-new Date(a.openingDate??a.createdAt??0))
    .slice(0,8);

  const accOpts  = accounts.map(a=>({v:a.accountNumber,l:`${a.accountNumber} — ${fmt(a.balance)}`}));
  const userOpts = users.map(u=>({v:u._id??u.id,l:`${u.name??''} ${u.surname??''}`.trim()||u.username}));
  const accTypeOpts  = [
    {v:'ahorro',    l:'Ahorro'},
    {v:'monetaria', l:'Monetaria'},
    {v:'nomina',    l:'Nómina'},
    {v:'corriente', l:'Corriente'},
  ];
  const statusOpts   = [{v:'activa',l:'Activa'},{v:'inactiva',l:'Inactiva'},{v:'bloqueada',l:'Bloqueada'}];
  const loanStatOpts = [
    {v:'solicitado',  l:'Solicitado'},
    {v:'aprobado',    l:'Aprobado'},
    {v:'desembolsado',l:'Desembolsado'},
    {v:'rechazado',   l:'Rechazado'},
    {v:'pagado',      l:'Pagado'},
    {v:'vencido',     l:'Vencido'},
  ];
  const cardTypeOpts    = [{v:'debito',l:'Débito'},{v:'credito',l:'Crédito'}];
  const networkBrandOpts = [
    {v:'mastercard', l:'Mastercard'},
    {v:'visa',       l:'Visa'},
    {v:'amex',       l:'American Express'},
  ];
  const lockReasonOpts=[{v:'seguridad',l:'Seguridad'},{v:'morosidad',l:'Morosidad'},{v:'solicitud_cliente',l:'Solicitud cliente'},{v:'fraude',l:'Fraude'}];
  const lockStatOpts = [{v:'bloqueado',l:'Bloqueado'},{v:'desbloqueado',l:'Desbloqueado'}];

  const handleTab = id=>{ if(id==='menu'){setDrawer(true);return;} if(id==='logout'){logout();return;} setTab(id); };

  // ── PANEL ──────────────────────────────────────────────────────────────────
  const Panel = () => (
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
      <Text style={[sc.pageTitle,{fontSize:FONT_SIZE.xl,color:C.textSub,fontWeight:FONT_WEIGHT.medium}]}>Bienvenido,</Text>
      <Text style={[sc.pageTitle,{marginBottom:16}]}>{storeUser?.name?`${storeUser.name}${storeUser.surname?' '+storeUser.surname:''}`.trim():(storeUser?.username??'Administrador')}</Text>

      {/* Stats 2×2 + total */}
      <View style={sc.statsGrid}>
        {[
          {icon:'people',         label:'Usuarios',       value:users.length,    color:'#fff',bg:C.primary},
          {icon:'account-balance',label:'Cuentas activas',value:activeAccounts,  color:'#fff',bg:C.primary},
          {icon:'credit-card',    label:'Tarjetas',       value:cards.length,    color:'#fff',bg:C.primary},
          {icon:'attach-money',   label:'Préstamos activos',value:activeLoans,   color:'#fff',bg:C.primary},
        ].map((s,i)=>(
          <View key={i} style={sc.statCard}>
            <View style={[sc.statIcon,{backgroundColor:s.bg}]}>
              <MaterialIcons name={s.icon} size={20} color={s.color}/>
            </View>
            <Text style={[sc.statVal,{color:C.primary}]}>{s.value}</Text>
            <Text style={sc.statLbl}>{s.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>
      {/* Total ancho completo */}
      <View style={[sc.statCard,{width:'100%',flexDirection:'row',alignItems:'center',
        gap:14,marginBottom:16}]}>
        <View style={[sc.statIcon,{backgroundColor:'#EFF6FF'}]}>
          <MaterialIcons name="account-balance-wallet" size={20} color={C.primary}/>
        </View>
        <View style={{flex:1}}>
          <Text style={[sc.statVal,{color:C.primary}]}>{fmt(totalBalance)}</Text>
          <Text style={sc.statLbl}>TOTAL EN CUENTAS</Text>
        </View>
      </View>

      <Text style={sc.sectionTitle}>Últimas cuentas creadas</Text>
      <View style={{marginTop:8}}>
        <HTable loading={loading&&!lastAccounts.length}
          cols={[
            {key:'num', label:'Nº Cuenta',w:130},
            {key:'type',label:'Tipo',     w:90},
            {key:'own', label:'Titular',  w:120},
            {key:'bal', label:'Balance',  w:120},
            {key:'st',  label:'Estado',   w:100},
            {key:'date',label:'Apertura', w:100},
          ]}
          data={lastAccounts}
          renderRow={a=>{
            const owner=users.find(u=>(u._id??u.id)===a.userId);
            return(<>
              <TD w={130} color={C.primary} bold>{a.accountNumber}</TD>
              <TD w={90}><Badge status={a.accountType}/></TD>
              <TD w={120}>{owner?`${owner.name??''} ${owner.surname??''}`.trim():'—'}</TD>
              <TD w={120} bold>{fmt(a.balance)}</TD>
              <TD w={100}><Badge status={a._displayStatus??a.status}/></TD>
              <TD w={100} color={C.textMuted}>{fmtDate(a.openingDate??a.createdAt)}</TD>
            </>);
          }}
        />
      </View>
    </ScrollView>
  );


  // ── USUARIOS → ver UsersScreen (componente externo arriba del export) ────

    // ── CUENTAS ────────────────────────────────────────────────────────────────
  const Accounts = () => {
    const filtered = search.trim()
      ? accounts.filter(a=>`${a.accountNumber} ${a.accountType} ${a.userId}`.toLowerCase().includes(search.toLowerCase()))
      : accounts;
    return (
      <View style={{flex:1}}>
        <View style={sc.pageHeader}>
          <View>
            <Text style={sc.pageTitle}>Cuentas</Text>
            <Text style={sc.pageSub}>Gestión de cuentas bancarias</Text>
          </View>
          <PBtn title="Nueva cuenta" icon="add" onPress={()=>setModal('newAccount')}/>
        </View>
        <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
          {/* Mini stats */}
          <View style={{flexDirection:'row',gap:8,marginBottom:14}}>
            {[
              {l:'Total',    v:accounts.length,                                        c:C.text},
              {l:'Activas',  v:accounts.filter(a=>(a._displayStatus??a.status)==='activa').length,    c:C.success},
              {l:'Inactivas',v:accounts.filter(a=>(a._displayStatus??a.status)==='inactiva').length,  c:C.error},
              {l:'Balance',  v:fmt(totalBalance),                                      c:C.primary},
            ].map((s,i)=>(
              <View key={i} style={[sc.miniStat,{flex:i===3?2:1}]}>
                <Text style={[sc.miniVal,{color:s.c}]}>{s.v}</Text>
                <Text style={sc.miniLbl}>{s.l}</Text>
              </View>
            ))}
          </View>
          <View style={[sc.searchBox,{marginBottom:10}]}>
            <MaterialIcons name="search" size={16} color={C.textMuted}/>
            <TextInput style={[{flex:1,fontSize:12,color:C.text},WEB]}
              value={search} onChangeText={setSearch}
              placeholder="Buscar Nº cuenta, tipo…" placeholderTextColor={C.textMuted}
              showSoftInputOnFocus={false}/>
            {search.length>0&&<TouchableOpacity onPress={()=>setSearch('')} hitSlop={{top:8,bottom:8,left:8,right:8}}>
              <MaterialIcons name="close" size={14} color={C.textMuted}/></TouchableOpacity>}
          </View>
          <Text style={{color:C.textSub,fontSize:11,marginBottom:10}}>
            Total: <Text style={{color:C.text,fontWeight:FONT_WEIGHT.bold}}>{accounts.length}</Text> cuentas
          </Text>
          <HTable loading={loading&&!accounts.length}
            cols={[
              {key:'num',   label:'Nº Cuenta',    w:130},
              {key:'type',  label:'Tipo',          w:90},
              {key:'own',   label:'Titular',       w:130},
              {key:'bal',   label:'Balance',       w:120},
              {key:'limit', label:'Límite diario', w:120},
              {key:'rate',  label:'Tasa anual',    w:100},
              {key:'cur',   label:'Moneda',        w:80},
              {key:'st',    label:'Estado',        w:100},
              {key:'date',  label:'Apertura',      w:100},
              {key:'dpi',   label:'DPI',           w:130},
              {key:'phone', label:'Teléfono',      w:110},
              {key:'addr',  label:'Dirección',     w:180},
              {key:'job',   label:'Empresa',       w:150},
              {key:'inc',   label:'Ingreso mensual',w:120},
              {key:'act',   label:'Acciones',      w:160},
            ]}
            data={filtered}
            renderRow={a=>{
              const owner=users.find(u=>(u._id??u.id)===a.userId);
              const ownerName=owner?`${owner.name??''} ${owner.surname??''}`.trim():'—';
              return (<>
                <TD w={130} color={C.primary} bold>{a.accountNumber}</TD>
                <TD w={90}><Badge status={a.accountType}/></TD>
                <TD w={130}>{ownerName}</TD>
                <TD w={120} bold>{fmt(a.balance)}</TD>
                <TD w={120} color={C.textSub}>{fmt(a.dailyWithdrawalLimit)}</TD>
                <TD w={100} color={C.textSub}>{`${a.annualInterestRate??'—'}%`}</TD>
                <TD w={80}  color={C.textSub}>{a.currency??a.currencyCode??'GTQ'}</TD>
                <TD w={100}><Badge status={a._displayStatus??a.status}/></TD>
                <TD w={100} color={C.textMuted}>{fmtDate(a.openingDate??a.createdAt)}</TD>
                <TD w={130} color={C.textMuted}>{a.dpi??'—'}</TD>
                <TD w={110} color={C.textSub}>{a.phone??'—'}</TD>
                <TD w={180} color={C.textSub}>{a.address??'—'}</TD>
                <TD w={150} color={C.textSub}>{a.jobName??'—'}</TD>
                <TD w={120}>{a.monthlyIncome?fmt(a.monthlyIncome):'—'}</TD>
                <TD w={200} actions>
                  <View style={{flexDirection:'row',gap:4}}>
                    <IBtn icon="info-outline" color={C.primaryMid}
                      onPress={()=>setAccModal({type:'detail',acc:a,ownerName})}/>
                    <IBtn icon="edit" color={C.warning}
                      onPress={()=>{accF.set('userId',a.userId);setModal('editAccount');}}/>
                    {(a._displayStatus??a.status)==='activa'
                      ? <IBtn icon="block" color={C.error}
                          onPress={()=>setAccModal({type:'confirm',acc:a,action:'desactivar',newStatus:'inactiva',ownerName})}/>
                      : <IBtn icon="check-circle" color={C.success}
                          onPress={()=>setAccModal({type:'confirm',acc:a,action:'activar',newStatus:'activa',ownerName})}/>
                    }
                    <IBtn icon="delete-outline" color={C.error}
                      onPress={()=>setAccModal({type:'confirm',acc:a,action:'eliminar',ownerName})}/>
                  </View>
                </TD>
              </>);
            }}
          />
        </ScrollView>
      </View>
    );
  };

  // ── TARJETAS ───────────────────────────────────────────────────────────────
  const Cards = () => (
    <View style={{flex:1}}>
      <View style={sc.pageHeader}>
        <View><Text style={sc.pageTitle}>Tarjetas</Text><Text style={sc.pageSub}>Crédito y débito</Text></View>
        <PBtn title="Nueva" icon="add" onPress={()=>setModal('newCard')}/>
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
        <View style={{flexDirection:'row',gap:8,marginBottom:14}}>
          {[
            {l:'Total',    v:cards.length,                                                   c:C.text},
            {l:'Activas',  v:cards.filter(c=>['activa','activo'].includes(c.status)).length, c:C.success},
            {l:'Bloqueadas',v:cards.filter(c=>c.status==='bloqueada').length,                c:C.warning},
            {l:'Balance',  v:fmt(cards.reduce((s,c)=>s+(c.availableBalance??0),0)),          c:C.primary},
          ].map((s,i)=>(
            <View key={i} style={[sc.miniStat,{flex:i===3?2:1}]}>
              <Text style={[sc.miniVal,{color:s.c}]}>{s.v}</Text>
              <Text style={sc.miniLbl}>{s.l}</Text>
            </View>
          ))}
        </View>
        <HTable loading={loading&&!cards.length}
          cols={[
            {key:'num',  label:'Número',     w:130},
            {key:'type', label:'Tipo',       w:90},
            {key:'user', label:'Titular',    w:150},
            {key:'acc',  label:'Cuenta',     w:130},
            {key:'st',   label:'Estado',     w:100},
            {key:'exp',  label:'Vence',      w:90},
            {key:'bal',  label:'Balance',    w:120},
            {key:'act',  label:'Acciones',   w:130},
          ]}
          data={cards}
          renderRow={c=>{
            const owner=users.find(u=>(u._id??u.id)===c.userId);
            const ownerName=owner?`${owner.name??''} ${owner.surname??''}`.trim():'—';
            return (<>
              <TD w={130} color={C.primary} bold>{`•••• ${String(c.cardNumber??'').slice(-4)}`}</TD>
              <TD w={90}><Badge status={c.cardType}/></TD>
              <TD w={150}>{ownerName}</TD>
              <TD w={130} color={C.textSub}>{c.accountNumber??'—'}</TD>
              <TD w={100}><Badge status={c.status}/></TD>
              <TD w={90} color={C.textMuted}>{c.expirationDate?new Date(c.expirationDate).toLocaleDateString('es-GT',{month:'2-digit',year:'2-digit'}):'—'}</TD>
              <TD w={120} bold>{fmt(c.availableBalance)}</TD>
              <TD w={150} actions>
                <View style={{flexDirection:'row',gap:4}}>
                  <IBtn icon="edit" color={C.warning}
                    onPress={()=>{
                      cardF.set('userId',c.userId);
                      cardF.set('cardType',c.cardType??'debito');
                      cardF.set('networkBrand',c.networkBrand??'mastercard');
                      cardF.set('availableBalance',String(c.availableBalance??''));
                      cardF.set('expirationDate',c.expirationDate??'');
                      setCardModal({type:'edit', card:c});
                      setModal('newCard');
                    }}/>
                  {c.status==='bloqueada'
                    ? <IBtn icon="lock-open" color={C.success}
                        onPress={()=>setCardModal({type:'confirm',card:c,action:'desbloquear',newStatus:'activa'})}/>
                    : <IBtn icon="lock" color={C.warning}
                        onPress={()=>setCardModal({type:'confirm',card:c,action:'bloquear',newStatus:'bloqueada'})}/>
                  }
                  <IBtn icon="delete-outline" color={C.error}
                    onPress={()=>setCardModal({type:'confirm',card:c,action:'eliminar'})}/>
                </View>
              </TD>
            </>);
          }}
        />
      </ScrollView>
    </View>
  );

  // ── TRANSACCIONES ──────────────────────────────────────────────────────────
  const Tx = () => (
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
      <Text style={sc.pageTitle}>Transacciones</Text>
      <Text style={[sc.pageSub,{marginBottom:14}]}>Historial de transferencias ({transactions.length})</Text>
      <HTable loading={loading&&!transactions.length}
        cols={[
          {key:'src',   label:'Cuenta origen',   w:140},
          {key:'dst',   label:'Cuenta destino',  w:140},
          {key:'amt',   label:'Monto',           w:120},
          {key:'type',  label:'Tipo',            w:110},
          {key:'cur',   label:'Moneda',          w:80},
          {key:'desc',  label:'Descripción',     w:160},
          {key:'st',    label:'Estado',          w:100},
          {key:'fav',   label:'Favorito',        w:80},
          {key:'alias', label:'Alias',           w:120},
          {key:'date',  label:'Fecha',           w:100},
          {key:'act',   label:'Acciones',        w:90},
        ]}
        data={transactions}
        renderRow={t=>(<>
          <TD w={140} color={C.primary} bold>{t.sourceAccountId??'—'}</TD>
          <TD w={140}>{t.destinationAccountId??'—'}</TD>
          <TD w={120} bold>{fmt(t.amount)}</TD>
          <TD w={110}><Badge status={t.transactionType}/></TD>
          <TD w={80} color={C.textSub}>{t.currencyId??'GTQ'}</TD>
          <TD w={160} color={C.textSub}>{t.description??'—'}</TD>
          <TD w={100}><Badge status={t.status??'exitosa'}/></TD>
          <TD w={80}><Badge status={t.favorito?'activo':'inactivo'}/></TD>
          <TD w={120} color={C.textSub}>{t.alias??'—'}</TD>
          <TD w={100} color={C.textMuted}>{fmtDate(t.transactionDate??t.createdAt)}</TD>
          <TD w={90}>
            <IBtn icon="delete-outline" color={C.error} onPress={()=>Alert.alert('Eliminar transacción',
              '¿Eliminar esta transacción?',
              [{text:'Cancelar',style:'cancel'},{text:'Eliminar',style:'destructive',
                onPress:()=>admin.deleteTx(t._id??t.id)}])}/>
          </TD>
        </>)}
      />
    </ScrollView>
  );

  // ── PRÉSTAMOS ─────────────────────────────────────────────────────────────
  const Loans = () => (
    <View style={{flex:1}}>
      <View style={sc.pageHeader}>
        <View><Text style={sc.pageTitle}>Préstamos</Text><Text style={sc.pageSub}>Gestión de préstamos</Text></View>
        <PBtn title="Nuevo" icon="add" onPress={()=>setModal('newLoan')}/>
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
        <HTable loading={loading&&!loans.length}
          cols={[
            {key:'usr',   label:'Usuario ID', w:140},
            {key:'acc',   label:'Cuenta',     w:130},
            {key:'req',   label:'Solicitado', w:120},
            {key:'apr',   label:'Aprobado',   w:120},
            {key:'rate',  label:'Tasa %',     w:80},
            {key:'term',  label:'Plazo',      w:80},
            {key:'pay',   label:'Cuota',      w:110},
            {key:'out',   label:'Pendiente',  w:120},
            {key:'st',    label:'Estado',     w:110},
            {key:'purp',  label:'Propósito',  w:180},
            {key:'appBy', label:'Aprobado por',w:140},
            {key:'req_d', label:'F. Solicitud',w:110},
            {key:'apr_d', label:'F. Aprobación',w:110},
            {key:'dis_d', label:'F. Desembolso',w:110},
            {key:'act',   label:'Acciones',   w:90},
          ]}
          data={loans}
          renderRow={l=>(<>
            <TD w={140} color={C.textMuted}>{l.userId}</TD>
            <TD w={130} color={C.primary} bold>{l.accountNumber??'—'}</TD>
            <TD w={120} bold>{fmt(l.requestedAmount)}</TD>
            <TD w={120}>{fmt(l.approvedAmount)}</TD>
            <TD w={80} color={C.textSub}>{`${l.interestRate??'—'}%`}</TD>
            <TD w={80} color={C.textSub}>{`${l.termMonths??'—'}m`}</TD>
            <TD w={110}>{fmt(l.monthlyPayment)}</TD>
            <TD w={120}>{fmt(l.outstandingBalance)}</TD>
            <TD w={110}><Badge status={l.status}/></TD>
            <TD w={180} color={C.textSub}>{l.loanPurpose??'—'}</TD>
            <TD w={140} color={C.textMuted}>{l.approvedByUserId??'—'}</TD>
            <TD w={110} color={C.textMuted}>{fmtDate(l.requestDate)}</TD>
            <TD w={110} color={C.textMuted}>{fmtDate(l.approvalDate)}</TD>
            <TD w={110} color={C.textMuted}>{fmtDate(l.disbursementDate)}</TD>
            <TD w={130}>
              <View style={{flexDirection:'row',gap:4}}>
                <IBtn icon="edit" color={C.warning}
                  onPress={()=>{
                    setLoanEdit({...l, _originalStatus: l.status}); // guardar status original
                    loanF.set('userId',         l.userId??'');
                    loanF.set('accountNumber',  l.accountNumber??'');
                    loanF.set('requestedAmount',String(l.requestedAmount??''));
                    loanF.set('approvedAmount', String(l.approvedAmount??''));
                    loanF.set('interestRate',   String(l.interestRate??''));
                    loanF.set('termMonths',     String(l.termMonths??''));
                    loanF.set('monthlyPayment', String(l.monthlyPayment??''));
                    loanF.set('outstandingBalance',String(l.outstandingBalance??''));
                    loanF.set('status',         l.status??'solicitado');
                    loanF.set('loanPurpose',    l.loanPurpose??'');
                    loanF.set('approvedByUserId',l.approvedByUserId??'');
                    loanF.set('requestDate',    l.requestDate?.slice(0,10)??today);
                    loanF.set('approvalDate',   l.approvalDate?.slice(0,10)??today);
                    loanF.set('disbursementDate',l.disbursementDate?.slice(0,16)??today);
                    setModal('newLoan');
                  }}/>
                <IBtn icon="delete-outline" color={C.error} onPress={()=>Alert.alert('Eliminar préstamo',
                  '¿Eliminar este préstamo?',[{text:'Cancelar',style:'cancel'},
                  {text:'Eliminar',style:'destructive',onPress:()=>admin.deleteLoan(l._id??l.id)}])}/>
              </View>
            </TD>
          </>)}
        />
      </ScrollView>
    </View>
  );

  // ── RETIROS ───────────────────────────────────────────────────────────────
  const [wdSearch, setWdSearch]     = useState('');
  const [wdResults, setWdResults]   = useState([]);
  const [wdLoading, setWdLoading]   = useState(false);
  const [wdBusy, setWdBusy]         = useState(false);
  const [wdAccNum, setWdAccNum]     = useState('');
  const [wdAmount, setWdAmount]     = useState('');

  const searchWithdrawals = async () => {
    if (!wdSearch.trim()) return;
    setWdLoading(true);
    try {
      const res = await userClient.get(`/withdrawal/statement/${wdSearch.trim()}`, {
        headers:{'Cache-Control':'no-cache'}, params:{_t:Date.now()}});
      const data = extract(res);
      setWdResults(data);
    } catch(e) {
      setWdResults([]);
    }
    setWdLoading(false);
  };

  const doAdminWithdrawal = async () => {
    if (!wdAccNum || !wdAmount) return;
    setWdBusy(true);
    try {
      const r = await admin.createWithdrawal({accountNumber:wdAccNum, amount:+wdAmount});
      if (r.success) {
        addNotif({icon:'arrow-upward',color:C.warning,bg:'#FFFBEB',
          title:'Retiro realizado', sub:`-${fmt(+wdAmount)} de ${wdAccNum}`});
        setWdAmount('');
        if (wdSearch === wdAccNum) searchWithdrawals();
      }
    } catch(e) {}
    setWdBusy(false);
  };

  const Withdrawals = () => (
    <View style={{flex:1}}>
      <View style={sc.pageHeader}>
        <View>
          <Text style={sc.pageTitle}>Retiros</Text>
          <Text style={sc.pageSub}>Consulta y gestión de retiros por cuenta</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
        showsVerticalScrollIndicator={false}>

        {/* Formulario retiro */}
        <View style={{backgroundColor:C.surface,borderRadius:12,padding:16,
          borderWidth:1,borderColor:C.border,marginBottom:16}}>
          <Text style={{fontSize:13,fontWeight:FONT_WEIGHT.bold,color:C.text,marginBottom:12}}>
            Realizar retiro
          </Text>
          <LSelect label="Cuenta *" value={wdAccNum} options={accOpts}
            onSelect={v=>{setWdAccNum(v); setWdSearch(v);}}/>
          <LInput label="Monto *" value={wdAmount}
            onChangeText={setWdAmount} numeric/>
          <PBtn title="Retirar" icon="arrow-upward" loading={wdBusy}
            onPress={doAdminWithdrawal}/>
        </View>

        {/* Búsqueda por número de cuenta */}
        <View style={{backgroundColor:C.surface,borderRadius:12,padding:16,
          borderWidth:1,borderColor:C.border,marginBottom:16}}>
          <Text style={{fontSize:13,fontWeight:FONT_WEIGHT.bold,color:C.text,marginBottom:12}}>
            Buscar retiros por cuenta
          </Text>
          <View style={{flexDirection:'row',gap:8,alignItems:'flex-end'}}>
            <View style={{flex:1}}>
              <LInput label="Número de cuenta" value={wdSearch}
                onChangeText={setWdSearch} placeholder="ACC-000-0000"/>
            </View>
            <PBtn title="Buscar" icon="search" loading={wdLoading}
              onPress={searchWithdrawals}/>
          </View>
        </View>

        {/* Resultados */}
        {wdResults.length > 0 && (
          <View style={{backgroundColor:C.surface,borderRadius:12,
            borderWidth:1,borderColor:C.border,overflow:'hidden'}}>
            <View style={{padding:12,borderBottomWidth:1,borderBottomColor:C.border}}>
              <Text style={{fontSize:13,fontWeight:FONT_WEIGHT.bold,color:C.text}}>
                {wdResults.length} retiro{wdResults.length!==1?'s':''} — {wdSearch}
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
              <View>
                {/* Header */}
                <View style={{flexDirection:'row',backgroundColor:'#F8FAFC',
                  paddingVertical:8,paddingHorizontal:4}}>
                  {['Cuenta','Monto','Bal. Anterior','Bal. Nuevo','Estado','Fecha'].map(h=>(
                    <Text key={h} style={{width:130,fontSize:11,fontWeight:FONT_WEIGHT.bold,
                      color:C.textSub,paddingHorizontal:8}}>
                      {h}
                    </Text>
                  ))}
                </View>
                {/* Filas */}
                {wdResults.map((w,i)=>(
                  <View key={w._id??i} style={{flexDirection:'row',
                    paddingVertical:10,paddingHorizontal:4,
                    borderTopWidth:1,borderTopColor:C.border,
                    backgroundColor:i%2===0?C.surface:'#F8FAFC'}}>
                    <Text style={{width:130,fontSize:12,color:C.primary,
                      fontWeight:FONT_WEIGHT.semibold,paddingHorizontal:8}}>
                      {w.accountNumber??'—'}
                    </Text>
                    <Text style={{width:130,fontSize:12,fontWeight:FONT_WEIGHT.bold,
                      color:C.error,paddingHorizontal:8}}>
                      -{fmt(w.amount??0)}
                    </Text>
                    <Text style={{width:130,fontSize:12,color:C.textSub,paddingHorizontal:8}}>
                      {fmt(w.previousBalance??w.balanceBefore??0)}
                    </Text>
                    <Text style={{width:130,fontSize:12,fontWeight:FONT_WEIGHT.semibold,
                      color:C.warning,paddingHorizontal:8}}>
                      {fmt(w.newBalance??w.balanceAfter??0)}
                    </Text>
                    <View style={{width:130,paddingHorizontal:8}}>
                      <Badge status={w.status??'exitosa'}/>
                    </View>
                    <Text style={{width:130,fontSize:11,color:C.textMuted,paddingHorizontal:8}}>
                      {w.createdAt?new Date(w.createdAt).toLocaleDateString('es-GT'):'—'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        {wdResults.length === 0 && wdSearch && !wdLoading && (
          <View style={{padding:32,alignItems:'center',gap:8}}>
            <MaterialIcons name="arrow-upward" size={36} color={C.textMuted}/>
            <Text style={{color:C.textSub,fontSize:13}}>Sin retiros para esta cuenta</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // ── DEPÓSITOS ─────────────────────────────────────────────────────────────
  const Deposits = () => (
    <View style={{flex:1}}>
      <View style={sc.pageHeader}>
        <View><Text style={sc.pageTitle}>Depósitos</Text><Text style={sc.pageSub}>Historial de depósitos</Text></View>
        <PBtn title="Nuevo" icon="add" onPress={()=>setModal('newDeposit')}/>
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
        <HTable loading={loading&&!deposits.length}
          cols={[
            {key:'acc',  label:'Nº Cuenta',      w:130},
            {key:'amt',  label:'Monto',           w:120},
            {key:'pb',   label:'Bal. Anterior',   w:120},
            {key:'nb',   label:'Bal. Nuevo',      w:120},
            {key:'cur',  label:'Moneda',          w:80},
            {key:'desc', label:'Descripción',     w:180},
            {key:'st',   label:'Estado',          w:100},
            {key:'date', label:'Fecha',           w:100},
            {key:'act',  label:'Acciones',        w:90},
          ]}
          data={deposits}
          renderRow={d=>(<>
            <TD w={130} color={C.primary} bold>{d.accountNumber??'—'}</TD>
            <TD w={120} bold>
              {(()=>{
                const cur = d.currencyCode??'GTQ';
                const sym = {GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[cur]??cur;
                return `${sym} ${(d.amount??0).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
              })()}
            </TD>
            <TD w={120} color={C.textSub}>{fmt(d.previousBalance)}</TD>
            <TD w={120} color={C.success} bold>{fmt(d.newBalance)}</TD>
            <TD w={80} color={C.textSub}>{d.currencyCode??'GTQ'}</TD>
            <TD w={180} color={C.textSub}>{d.description??'—'}</TD>
            <TD w={100}><Badge status={d.status??'exitosa'}/></TD>
            <TD w={100} color={C.textMuted}>{fmtDate(d.createdAt)}</TD>
            <TD w={90}>
              <IBtn icon="undo" color={C.warning}
                onPress={()=>Alert.alert('Revertir depósito',
                  `¿Revertir el depósito de ${fmt(d.amount)} en ${d.accountNumber}?`,
                  [{text:'Cancelar',style:'cancel'},{text:'Revertir',style:'destructive',
                    onPress:async()=>{
                      const r=await admin.revertDeposit(d._id??d.id);
                      if(r.success) addNotif({icon:'undo',color:C.warning,bg:'#FFFBEB',
                        title:'Depósito revertido',sub:`${fmt(d.amount)} en ${d.accountNumber}`});
                    }}])}/>
            </TD>
          </>)}
        />
      </ScrollView>
    </View>
  );

  // ── ESTADOS ───────────────────────────────────────────────────────────────
  const Statements = () => (
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
      <Text style={sc.pageTitle}>Estados de Cuenta</Text>
      <Text style={[sc.pageSub,{marginBottom:14}]}>Movimientos generales ({statements.length})</Text>
      <HTable loading={loading&&!statements.length}
        cols={[
          {key:'acc',  label:'Cuenta',  w:130},
          {key:'type', label:'Tipo',    w:120},
          {key:'amt',  label:'Monto',   w:120},
          {key:'date', label:'Fecha',   w:110},
        ]}
        data={statements}
        renderRow={s=>(<>
          <TD w={130} color={C.primary} bold>{s.accountNumber??'—'}</TD>
          <TD w={120}><Badge status={s.transactionType??s.type??'—'}/></TD>
          <TD w={120} bold>{fmt(s.amount)}</TD>
          <TD w={110} color={C.textMuted}>{fmtDate(s.date??s.createdAt)}</TD>
        </>)}
      />
    </ScrollView>
  );

  // ── MONEDAS ───────────────────────────────────────────────────────────────
  const Coins = () => (
    <View style={{flex:1}}>
      <View style={sc.pageHeader}>
        <View><Text style={sc.pageTitle}>Monedas</Text><Text style={sc.pageSub}>Divisas registradas</Text></View>
        <PBtn title="Nueva" icon="add" onPress={()=>setModal('newCoin')}/>
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
        <HTable loading={loading&&!coins.length}
          cols={[
            {key:'code', label:'Código',  w:90},
            {key:'name', label:'Nombre',  w:130},
            {key:'sym',  label:'Símbolo', w:80},
            {key:'rate', label:'Tasa',    w:90},
            {key:'base', label:'Base',    w:80},
            {key:'st',   label:'Estado',  w:100},
            {key:'act',  label:'Acciones',w:110},
          ]}
          data={coins}
          renderRow={c=>(<>
            <TD w={90} color={C.primary} bold>{c.code??c.symbol}</TD>
            <TD w={130}>{c.name}</TD>
            <TD w={80} color={C.textSub}>{c.symbol}</TD>
            <TD w={90}>{String(c.exchangeRate??'—')}</TD>
            <TD w={80}><Badge status={c.baseCurrency?'activa':'inactiva'}/></TD>
            <TD w={100}><Badge status={c.status??'activa'}/></TD>
            <TD w={110} actions>  
                  <View style={{flexDirection:'row',gap:5}}>
                <IBtn icon={c.status==='activa'?'block':'check-circle'}
                  color={c.status==='activa'?C.warning:C.success}
                  onPress={()=>admin.toggleCoin(c._id??c.id,c.status==='activa'?'inactiva':'activa')}/>
                <IBtn icon="delete-outline" color={C.error}
                  onPress={()=>Alert.alert('Eliminar moneda',`¿Eliminar ${c.name}?`,
                    [{text:'Cancelar',style:'cancel'},{text:'Eliminar',style:'destructive',
                      onPress:()=>admin.deleteCoin(c._id??c.id)}])}/>
              </View>
            </TD>
          </>)}
        />
      </ScrollView>
    </View>
  );

  // ── BLOQUEOS ──────────────────────────────────────────────────────────────
  const Locks = () => {
    const lockedAccounts = accounts.filter(a => a.status === 'bloqueada');
    const allLocked = [
      ...lockedAccounts.map(a => ({
        _id:       a._id??a.id,           // _id de MongoDB de la cuenta
        accountId: a.accountNumber,
        userId:    a.userId,
        lockReason:'bloqueo_admin',
        description:'Bloqueada por administrador',
        status:    'bloqueado',
        lockDate:  a.updatedAt??a.createdAt,
        isFromStatus: true,
        // Guardar referencia completa de la cuenta para el modal
        _accRef:   a,
      })),
      ...locks.filter(l => !lockedAccounts.find(a => a.accountNumber === (l.accountId??l.account))),
    ];
    return (
    <View style={{flex:1}}>
      <View style={sc.pageHeader}>
        <View>
          <Text style={sc.pageTitle}>Cuentas bloqueadas</Text>
          <Text style={sc.pageSub}>{lockedAccounts.length} bloqueadas via estado · {locks.length} registros manuales</Text>
        </View>
        <PBtn title="Bloquear" icon="lock" onPress={()=>setModal('newLock')}/>
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
        <HTable loading={loading&&!allLocked.length} emptyMsg="No hay cuentas bloqueadas"
          cols={[
            {key:'acc',  label:'Cuenta',      w:130},
            {key:'usr',  label:'Usuario ID',  w:140},
            {key:'rsn',  label:'Motivo',      w:140},
            {key:'desc', label:'Descripción', w:190},
            {key:'st',   label:'Estado',      w:110},
            {key:'lock', label:'F. Bloqueo',  w:110},
            {key:'act',  label:'Acciones',    w:120},
          ]}
          data={allLocked}
          renderRow={l=>{
            const owner = users.find(u=>(u._id??u.id)===l.userId);
            return (<>
              <TD w={130} color={C.primary} bold>{l.accountId??l.account??'—'}</TD>
              <TD w={140} color={C.textMuted}>{owner?`${owner.name??''} ${owner.surname??''}`.trim():l.userId??'—'}</TD>
              <TD w={140}><Badge status={l.lockReason??'—'}/></TD>
              <TD w={190} color={C.textSub}>{l.description??'—'}</TD>
              <TD w={110}><Badge status={l.status??'bloqueado'}/></TD>
              <TD w={110} color={C.textMuted}>{fmtDate(l.lockDate)}</TD>
              <TD w={120}>
                <View style={{flexDirection:'row',gap:5}}>
                  <IBtn icon="lock-open" color={C.success}
                    onPress={async()=>{
                      if (!l._id && !l.id) return;
                      const lockId = l._id ?? l.id;
                      const accNum = l.accountId ?? l.account;
                      const r = await admin.unlockAccount(lockId, {
                        accountId:      accNum,
                        userId:         l.userId,
                        lockReason:     l.lockReason??'seguridad',
                        description:    l.description??'',
                        lockDate:       l.lockDate??new Date().toISOString(),
                        unlockDate:     new Date().toISOString(),
                        lockedBy:       l.lockedBy??'',
                        unlockedBy:     storeUser?.id??storeUser?._id??'',
                        automatic:      l.automatic??false,
                        failedAttempts: l.failedAttempts??0,
                        status:         'desbloqueado',
                      });
                      if(r.success){
                        // Quitar de AsyncStorage para que el cliente lo vea desbloqueado
                        try {
                          const stored = await AsyncStorage.getItem('pb_locked_accounts');
                          const locks = stored ? JSON.parse(stored) : {};
                          delete locks[accNum];
                          await AsyncStorage.setItem('pb_locked_accounts', JSON.stringify(locks));
                        } catch(e) { if(__DEV__) console.log('[unlock] storage error:', e); }
                        addNotif({icon:'lock-open',color:C.success,bg:'#F0FDF4',
                          title:'Cuenta desbloqueada',sub:accNum});
                      }
                    }}/>
                  {!l.isFromStatus && (
                    <IBtn icon="delete-outline" color={C.error}
                      onPress={()=>admin.deleteLock(l._id??l.id)}/>
                  )}
                </View>
              </TD>
            </>);
          }}
        />
      </ScrollView>
    </View>
    );
  };

  // ── SERVICIOS ─────────────────────────────────────────────────────────────
  const Services = () => (
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchAll} tintColor={C.primary}/>}>
      <Text style={sc.pageTitle}>Servicios</Text>
      <Text style={[sc.pageSub,{marginBottom:14}]}>Servicios bancarios disponibles</Text>
      <HTable loading={loading&&!services.length}
        cols={[
          {key:'name',label:'Nombre',       w:160},
          {key:'desc',label:'Descripción',  w:240},
          {key:'st',  label:'Estado',       w:100},
        ]}
        data={services}
        renderRow={s=>(<>
          <TD w={160} bold>{s.name??s.nombre??'—'}</TD>
          <TD w={240} color={C.textSub}>{s.description??s.descripcion??'—'}</TD>
          <TD w={100}><Badge status={s.status??'activo'}/></TD>
        </>)}
      />
    </ScrollView>
  );

  const renderContent = () => {
    switch(tab) {
      case 'panel':      return <Panel/>;
      case 'users':      return <UsersScreen users={users} loading={loading} fetchAll={fetchAll} onChangeRole={admin.changeRole} onAddNotif={addNotif} currentUser={storeUser}/>;
      case 'accounts':   return <Accounts/>;
      case 'cards':      return <Cards/>;
      case 'profile':    return <ProfileScreen onLogout={logout} addNotif={addNotif}/>;
      case 'tx':         return <Tx/>;
      case 'loans':      return <Loans/>;
      case 'deposits':   return <Deposits/>;
      case 'withdrawals':return <Withdrawals/>;
      case 'statements': return <Statements/>;
      case 'coins':      return <Coins/>;
      case 'locks':      return <Locks/>;
      case 'services':   return <Services/>;
      default:           return <Panel/>;
    }
  };

  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      {/* AppBar */}
      <View style={sc.appBar}>
        <View style={sc.appBarLogoBg}>
          <Image source={require('../../../../assets/LogoBancokinal.png')}
            style={sc.appBarLogoImg} resizeMode="contain"/>
        </View>
        <View style={{flex:1}}/>
        {/* Notificaciones */}
        <TouchableOpacity style={sc.notifBtn} onPress={()=>setNotifOpen(true)}>
          <MaterialIcons name="notifications-none" size={22} color="#fff"/>
          {notifs.length>0&&<View style={sc.notifDot}/>}
        </TouchableOpacity>
        {storeUser&&(
          <View style={sc.userBadge}>
            <MaterialIcons name="admin-panel-settings" size={13} color="#fff"/>
            <Text style={{fontSize:10,color:'#fff',fontWeight:FONT_WEIGHT.semibold}}>
              {storeUser.username??storeUser.name}
            </Text>
          </View>
        )}
      </View>

      {/* Mensajes */}
      {(error||success)&&(
        <View style={{paddingHorizontal:16,paddingTop:8}}>
          <Banner msg={error??success} type={error?'error':'success'} onClose={clearMsg}/>
        </View>
      )}

      {/* Contenido */}
      <View style={{flex:1}}>{renderContent()}</View>

      {/* Tab bar */}
      <TabBar active={tab} onSelect={handleTab}/>

      {/* Modal detalle cuenta */}
      {accModal?.type==='detail' && (
        <Modal visible transparent animationType="fade" onRequestClose={()=>setAccModal(null)}>
          <TouchableOpacity style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',alignItems:'center'}}
            activeOpacity={1} onPress={()=>setAccModal(null)}>
            <View style={{backgroundColor:C.surface,borderRadius:16,padding:24,width:'88%',maxWidth:400}}>
              <Text style={{fontSize:16,fontWeight:FONT_WEIGHT.bold,color:C.primary,marginBottom:14}}>
                {accModal.acc.accountNumber}
              </Text>
              {[
                {icon:'person',      l:'Titular',    v:accModal.ownerName},
                {icon:'category',    l:'Tipo',       v:accModal.acc.accountType},
                {icon:'account-balance-wallet', l:'Balance', v:fmt(accModal.acc.balance)},
                {icon:'circle',      l:'Estado',     v:accModal.acc.status},
                {icon:'monetization-on', l:'Moneda', v:accModal.acc.currency??accModal.acc.currencyCode??'GTQ'},
                {icon:'trending-up', l:'Tasa anual', v:`${accModal.acc.annualInterestRate??'—'}%`},
                {icon:'today',       l:'Apertura',   v:accModal.acc.openingDate?new Date(accModal.acc.openingDate).toLocaleDateString('es-GT'):'—'},
                {icon:'fingerprint', l:'DPI',        v:accModal.acc.dpi??'—'},
                {icon:'home',        l:'Dirección',  v:accModal.acc.address??'—'},
                {icon:'work',        l:'Empresa',    v:accModal.acc.jobName??'—'},
                {icon:'payments',    l:'Ingreso',    v:fmt(accModal.acc.monthlyIncome)},
              ].map((r,i)=>(
                <View key={i} style={{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8}}>
                  <MaterialIcons name={r.icon} size={15} color={C.textSub}/>
                  <Text style={{fontSize:11,color:C.textSub,width:72}}>{r.l}</Text>
                  <Text style={{flex:1,fontSize:11,color:C.text,fontWeight:FONT_WEIGHT.medium}}>{r.v}</Text>
                </View>
              ))}
              <TouchableOpacity style={{marginTop:10,backgroundColor:C.primary,borderRadius:8,
                padding:12,alignItems:'center'}} onPress={()=>setAccModal(null)}>
                <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:13}}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Modal confirmar acción cuenta — sin hooks internos (reglas de hooks) */}
      {accModal?.type==='confirm' && (()=>{
        const {acc,action,newStatus,ownerName} = accModal;
        const colorMap = {activar:C.success,desactivar:C.error,eliminar:C.error,bloquear:C.warning};
        const iconMap  = {activar:'check-circle',desactivar:'block',eliminar:'delete-forever',bloquear:'lock'};
        const labelMap = {activar:'Activar',desactivar:'Desactivar',eliminar:'Eliminar',bloquear:'Bloquear'};
        // doAction usa accBusy/setAccBusy del componente padre — sin hooks internos
        const doAction = async()=>{
          setAccBusy(true);
          let r;
          if(action==='eliminar'){
            r = await admin.deleteAccount(acc.accountNumber);
            if(r.success) addNotif({icon:'delete',color:C.error,bg:'#FEF2F2',
              title:'Cuenta eliminada',sub:acc.accountNumber});
          } else {
            // PATCH /accounts/:accountNumber/status — el backend requiere accountNumber
            // (formato ACC-000-0000), NO el _id de MongoDB
            r = await admin.toggleAccount(acc.accountNumber, newStatus);
            if(r.success) addNotif({
              icon: iconMap[action], color: colorMap[action],
              bg: action==='activar' ? '#F0FDF4' : '#FEF2F2',
              title: `Cuenta ${newStatus}`, sub: acc.accountNumber,
            });
          }
          setAccBusy(false);
          if(r.success) setAccModal(null);
        };
        return (
          <Modal visible transparent animationType="fade"
            onRequestClose={()=>!accBusy&&setAccModal(null)}>
            <TouchableOpacity
              style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',alignItems:'center'}}
              activeOpacity={1} onPress={()=>!accBusy&&setAccModal(null)}>
              <View style={{backgroundColor:C.surface,borderRadius:16,padding:24,width:'85%',maxWidth:360}}>
                <View style={{width:52,height:52,borderRadius:26,
                  backgroundColor:colorMap[action]+'20',justifyContent:'center',alignItems:'center',
                  alignSelf:'center',marginBottom:14}}>
                  <MaterialIcons name={iconMap[action]} size={26} color={colorMap[action]}/>
                </View>
                <Text style={{fontSize:15,fontWeight:FONT_WEIGHT.bold,color:C.text,
                  marginBottom:8,textAlign:'center'}}>
                  {labelMap[action]} cuenta
                </Text>
                <Text style={{fontSize:13,color:C.textSub,textAlign:'center',lineHeight:20,marginBottom:20}}>
                  {action==='eliminar'
                    ? `¿Eliminar ${acc.accountNumber} de ${ownerName}?\nEsta acción no se puede deshacer.`
                    : `¿${labelMap[action]} la cuenta ${acc.accountNumber} de ${ownerName}?`}
                </Text>
                <View style={{flexDirection:'row',gap:10}}>
                  <TouchableOpacity
                    style={{flex:1,borderRadius:8,padding:12,alignItems:'center',
                      borderWidth:1.5,borderColor:C.border}}
                    onPress={()=>setAccModal(null)} disabled={accBusy}>
                    <Text style={{color:C.textSub,fontWeight:FONT_WEIGHT.semibold,fontSize:13}}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{flex:1,borderRadius:8,padding:12,alignItems:'center',
                      backgroundColor:colorMap[action]}}
                    onPress={doAction} disabled={accBusy}>
                    {accBusy
                      ? <ActivityIndicator color="#fff" size="small"/>
                      : <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:13}}>
                          {labelMap[action]}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        );
      })()}

      {/* Modal confirmar acción tarjeta */}
      {cardModal?.type==='confirm' && (()=>{
        const {card,action,newStatus} = cardModal;
        const last4 = `••••${String(card?.cardNumber??'').slice(-4)}`;
        const colorMap = {bloquear:C.warning, desbloquear:C.success, eliminar:C.error};
        const iconMap  = {bloquear:'lock', desbloquear:'lock-open', eliminar:'delete-forever'};
        const labelMap = {bloquear:'Bloquear', desbloquear:'Desbloquear', eliminar:'Eliminar'};
        const doAction = async()=>{
          setCardBusy(true);
          let r;
          if(action==='eliminar'){
            r = await admin.deleteCard(card._id??card.id);
            if(r.success) addNotif({icon:'delete',color:C.error,bg:'#FEF2F2',
              title:'Tarjeta eliminada',sub:last4});
          } else {
            r = await admin.toggleCard(card._id??card.id, newStatus);
            if(r.success) addNotif({
              icon:iconMap[action],color:colorMap[action],
              bg:action==='desbloquear'?'#F0FDF4':'#FFFBEB',
              title:`Tarjeta ${newStatus}`,sub:last4});
          }
          setCardBusy(false);
          if(r.success) setCardModal(null);
        };
        return (
          <Modal visible transparent animationType="fade"
            onRequestClose={()=>!cardBusy&&setCardModal(null)}>
            <TouchableOpacity
              style={{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'center',alignItems:'center'}}
              activeOpacity={1} onPress={()=>!cardBusy&&setCardModal(null)}>
              <View style={{backgroundColor:C.surface,borderRadius:16,padding:24,width:'85%',maxWidth:360}}>
                <View style={{width:52,height:52,borderRadius:26,
                  backgroundColor:colorMap[action]+'20',justifyContent:'center',alignItems:'center',
                  alignSelf:'center',marginBottom:14}}>
                  <MaterialIcons name={iconMap[action]} size={26} color={colorMap[action]}/>
                </View>
                <Text style={{fontSize:15,fontWeight:FONT_WEIGHT.bold,color:C.text,
                  marginBottom:8,textAlign:'center'}}>
                  {labelMap[action]} tarjeta
                </Text>
                <Text style={{fontSize:13,color:C.textSub,textAlign:'center',lineHeight:20,marginBottom:20}}>
                  {action==='eliminar'
                    ? `¿Eliminar la tarjeta ${last4}? Esta acción no se puede deshacer.`
                    : `¿${labelMap[action]} la tarjeta ${last4}?`}
                </Text>
                <View style={{flexDirection:'row',gap:10}}>
                  <TouchableOpacity
                    style={{flex:1,borderRadius:8,padding:12,alignItems:'center',
                      borderWidth:1.5,borderColor:C.border}}
                    onPress={()=>setCardModal(null)} disabled={cardBusy}>
                    <Text style={{color:C.textSub,fontWeight:FONT_WEIGHT.semibold,fontSize:13}}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{flex:1,borderRadius:8,padding:12,alignItems:'center',
                      backgroundColor:colorMap[action]}}
                    onPress={doAction} disabled={cardBusy}>
                    {cardBusy
                      ? <ActivityIndicator color="#fff" size="small"/>
                      : <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:13}}>
                          {labelMap[action]}
                        </Text>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        );
      })()}

      {/* Drawer */}
      <DrawerMenu visible={drawer} onClose={()=>setDrawer(false)} onSelect={id=>{ setDrawer(false); handleTab(id); }}/>

      {/* Panel notificaciones */}
      <NotifPanel visible={notifOpen} onClose={()=>setNotifOpen(false)}
        notifs={notifs} onClear={()=>setNotifs([])}/>

      {/* ── MODALES ──────────────────────────────────────────────────────── */}

      {/* Nueva cuenta */}
      <LModal visible={modal==='newAccount'||modal==='editAccount'}
        title={modal==='editAccount'?'Editar cuenta':'Nueva cuenta bancaria'}
        onClose={()=>setModal(null)}>
        <Banner msg={error} type="error" onClose={clearMsg}/>
        <LSelect label="Usuario *" value={accF.v.userId} options={userOpts} onSelect={v=>accF.set('userId',v)} required/>
        <LSelect label="Tipo de cuenta *" value={accF.v.accountType} options={accTypeOpts} onSelect={v=>accF.set('accountType',v)} required/>
        <LInput label="Balance inicial" value={accF.v.balance} onChangeText={v=>accF.set('balance',v)} numeric/>
        <LInput label="Fecha de apertura (YYYY-MM-DD)" value={accF.v.openingDate} onChangeText={v=>accF.set('openingDate',v)}/>
        <LSelect label="Estado" value={accF.v.status} options={statusOpts} onSelect={v=>accF.set('status',v)}/>
        <LInput label="Límite retiro diario" value={accF.v.dailyWithdrawalLimit} onChangeText={v=>accF.set('dailyWithdrawalLimit',v)} numeric/>
        <LInput label="Tasa interés anual (%)" value={accF.v.annualInterestRate} onChangeText={v=>accF.set('annualInterestRate',v)} numeric/>
        <LInput label="Código moneda" value={accF.v.currencyCode} onChangeText={v=>accF.set('currencyCode',v)}/>
        <LInput label="DPI del titular" value={accF.v.dpi} onChangeText={v=>accF.set('dpi',v)}/>
        <LInput label="Dirección" value={accF.v.address} onChangeText={v=>accF.set('address',v)}/>
        <LInput label="Teléfono" value={accF.v.phone} onChangeText={v=>accF.set('phone',v)}/>
        <LInput label="Empresa / trabajo" value={accF.v.jobName} onChangeText={v=>accF.set('jobName',v)}/>
        <LInput label="Ingreso mensual" value={accF.v.monthlyIncome} onChangeText={v=>accF.set('monthlyIncome',v)} numeric/>
        <PBtn title="Guardar cuenta" icon="save" loading={submitting} onPress={async()=>{
          if(!accF.v.userId){Alert.alert('Requerido','Selecciona un usuario.');return;}
          const body={userId:accF.v.userId,accountType:accF.v.accountType,
            balance:+accF.v.balance||0,
            openingDate:accF.v.openingDate?new Date(accF.v.openingDate).toISOString():new Date().toISOString(),
            status:accF.v.status,dailyWithdrawalLimit:+accF.v.dailyWithdrawalLimit||1000,
            annualInterestRate:+accF.v.annualInterestRate||0,currencyCode:accF.v.currencyCode||'GTQ',
            dpi:accF.v.dpi,address:accF.v.address,phone:accF.v.phone,
            jobName:accF.v.jobName,monthlyIncome:+accF.v.monthlyIncome||0};
          const r=await admin.createAccount(body);
          if(r.success){
            setModal(null);accF.reset();
            addNotif({icon:'account-balance',color:C.success,bg:'#F0FDF4',
              title:'Cuenta creada',sub:`${r.data?.accountNumber??''} - ${accF.v.accountType}`});
          }
        }}/>
        <View style={{height:8}}/><PBtn title="Cancelar" onPress={()=>setModal(null)} ghost/>
      </LModal>

      {/* Nueva tarjeta */}
      <LModal visible={modal==='newCard'} title="Emitir tarjeta" onClose={()=>setModal(null)}>
        <Banner msg={error} type="error" onClose={clearMsg}/>
        <LSelect label="Usuario *" value={cardF.v.userId} options={userOpts} onSelect={v=>cardF.set('userId',v)} required/>
        <LSelect label="Tipo *" value={cardF.v.cardType} options={cardTypeOpts} onSelect={v=>cardF.set('cardType',v)} required/>
        <LSelect label="Red de pago *" value={cardF.v.networkBrand} options={networkBrandOpts} onSelect={v=>cardF.set('networkBrand',v)} required/>
        <LInput label="CVV (3 dígitos) *" value={cardF.v.cvv} onChangeText={v=>cardF.set('cvv',v)} numeric required/>
        <LInput label="Balance disponible" value={cardF.v.availableBalance} onChangeText={v=>cardF.set('availableBalance',v)} numeric/>
        <LInput label="Fecha expiración (YYYY-MM-DD)" value={cardF.v.expirationDate} onChangeText={v=>cardF.set('expirationDate',v)}/>
        <LInput label="PIN (4 dígitos) *" value={cardF.v.pin} onChangeText={v=>cardF.set('pin',v)} numeric secure required/>
        <PBtn title="Emitir tarjeta" icon="credit-card" loading={submitting} onPress={async()=>{
          if(!cardF.v.userId||!cardF.v.cvv||!cardF.v.pin){Alert.alert('Requerido','Completa los campos obligatorios.');return;}
          const r=await admin.createCard({userId:cardF.v.userId,cardType:cardF.v.cardType,
            networkBrand:cardF.v.networkBrand||'mastercard',
            status:'activa',
            cvv:cardF.v.cvv,availableBalance:+cardF.v.availableBalance||0,
            expirationDate:cardF.v.expirationDate,pin:cardF.v.pin});
          if(r.success){
            setModal(null);cardF.reset();
            addNotif({icon:'credit-card',color:C.primaryMid,bg:'#EFF6FF',
              title:'Tarjeta emitida',sub:`${cardF.v.cardType} para usuario`});
          }
        }}/>
        <View style={{height:8}}/><PBtn title="Cancelar" onPress={()=>setModal(null)} ghost/>
      </LModal>

      {/* Nuevo préstamo */}
      <LModal visible={modal==='newLoan'} title={loanEdit?'Editar préstamo':'Nuevo préstamo'}
        onClose={()=>{setModal(null);setLoanEdit(null);loanF.reset();}}>
        <Banner msg={error} type="error" onClose={clearMsg}/>
        <LSelect label="Usuario *" value={loanF.v.userId} options={userOpts}
          onSelect={v=>loanF.set('userId',v)} required/>
        <LSelect label="Cuenta *" value={loanF.v.accountNumber} options={accOpts}
          onSelect={v=>loanF.set('accountNumber',v)} required/>
        <LInput label="Monto solicitado *" value={loanF.v.requestedAmount}
          onChangeText={v=>loanF.set('requestedAmount',v)} numeric required/>
        <LInput label="Monto aprobado" value={loanF.v.approvedAmount}
          onChangeText={v=>loanF.set('approvedAmount',v)} numeric/>
        <LInput label="Tasa de interés (%)" value={loanF.v.interestRate}
          onChangeText={v=>loanF.set('interestRate',v)} numeric/>
        <LInput label="Plazo en meses" value={loanF.v.termMonths}
          onChangeText={v=>loanF.set('termMonths',v)} numeric/>
        <LInput label="Cuota mensual" value={loanF.v.monthlyPayment}
          onChangeText={v=>loanF.set('monthlyPayment',v)} numeric/>
        <LSelect label="Estado" value={loanF.v.status} options={loanStatOpts}
          onSelect={v=>loanF.set('status',v)}/>
        <LInput label="Propósito" value={loanF.v.loanPurpose}
          onChangeText={v=>loanF.set('loanPurpose',v)} multiline/>
        <PBtn title={loanEdit?'Guardar cambios':'Crear préstamo'} icon="attach-money"
          loading={submitting} onPress={async()=>{
          if(!loanF.v.userId||!loanF.v.accountNumber||!loanF.v.requestedAmount){
            Alert.alert('Requerido','Usuario, cuenta y monto son requeridos.');return;}
          const today = new Date().toISOString();
          const approvedAmt = +loanF.v.approvedAmount||+loanF.v.requestedAmount;
          const body = {
            userId:           loanF.v.userId,
            accountNumber:    loanF.v.accountNumber,
            requestedAmount:  +loanF.v.requestedAmount,
            approvedAmount:   approvedAmt,
            interestRate:     +loanF.v.interestRate||0,
            termMonths:       +loanF.v.termMonths||12,
            monthlyPayment:   +loanF.v.monthlyPayment||0,
            outstandingBalance:approvedAmt,
            requestDate:      today,
            approvalDate:     today,
            disbursementDate: today,
            status:           loanF.v.status||'solicitado',
            loanPurpose:      loanF.v.loanPurpose||'',
            approvedByUserId: storeUser?._id||storeUser?.id||'',
          };
          let r;
          if(loanEdit){ r=await admin.updateLoan(loanEdit._id??loanEdit.id,body); }
          else { r=await admin.createLoan(body); }
          if(!r.success) return;
          // Guardar en AsyncStorage para que el cliente lo vea
          try{
            const stored=await AsyncStorage.getItem('pb_loans');
            const allL=stored?JSON.parse(stored):[];
            const lid=loanEdit?(loanEdit._id??loanEdit.id):(r.data?.data?._id||r.data?._id||String(Date.now()));
            const idx=allL.findIndex(l=>(l._id??l.id)===lid);
            // Incluir userId explícitamente para que el cliente pueda filtrar
            const entry={...body, _id:lid, userId:loanF.v.userId};
            if(idx>=0)allL[idx]=entry; else allL.push(entry);
            await AsyncStorage.setItem('pb_loans',JSON.stringify(allL));
          }catch(e){}
          setModal(null); loanF.reset(); setLoanEdit(null);
          addNotif({icon:'attach-money',color:C.warning,bg:'#FFFBEB',
            title:loanEdit?'Préstamo actualizado':'Préstamo creado',
            sub:`${loanF.v.accountNumber} — ${loanF.v.status||'solicitado'}`});
          fetchAll();
        }}/>
        <View style={{height:8}}/>
        <PBtn title="Cancelar" onPress={()=>{setModal(null);setLoanEdit(null);loanF.reset();}} ghost/>
      </LModal>
      {/* Nueva moneda */}
      <LModal visible={modal==='newCoin'} title="Nueva moneda" onClose={()=>setModal(null)}>
        <Banner msg={error} type="error" onClose={clearMsg}/>
        <LInput label="Código (GTQ, USD…) *" value={coinF.v.code} onChangeText={v=>coinF.set('code',v)} required/>
        <LInput label="Nombre *" value={coinF.v.name} onChangeText={v=>coinF.set('name',v)} required/>
        <LInput label="Símbolo (Q, $, €…) *" value={coinF.v.symbol} onChangeText={v=>coinF.set('symbol',v)} required/>
        <LInput label="Tasa de cambio *" value={coinF.v.exchangeRate} onChangeText={v=>coinF.set('exchangeRate',v)} numeric required/>
        {coinF.v.code?.toUpperCase()==='GTQ' && (
          <View style={{backgroundColor:'#EFF6FF',borderRadius:8,padding:10,marginBottom:8}}>
            <Text style={{fontSize:11,color:C.primaryMid}}>
              El Quetzal (GTQ) es la moneda base — su tasa siempre es 1. Los demás valores se convierten respecto al Quetzal.
            </Text>
          </View>
        )}
        <LSelect label="¿Moneda base?" value={coinF.v.baseCurrency}
          options={[{v:'true',l:'Sí (moneda base)'},{v:'false',l:'No'}]}
          onSelect={v=>coinF.set('baseCurrency',v)}/>
        <LSelect label="Estado" value={coinF.v.status}
          options={[{v:'activa',l:'Activa'},{v:'inactiva',l:'Inactiva'}]}
          onSelect={v=>coinF.set('status',v)}/>
        <PBtn title="Crear moneda" loading={submitting} onPress={async()=>{
          if(!coinF.v.code||!coinF.v.name||!coinF.v.symbol){Alert.alert('Requerido','Completa código, nombre y símbolo.');return;}
          const r=await admin.createCoin({code:coinF.v.code.toUpperCase(),name:coinF.v.name,
            symbol:coinF.v.symbol,exchangeRate:+coinF.v.exchangeRate||1,
            baseCurrency:coinF.v.baseCurrency==='true',status:coinF.v.status});
          if(r.success){setModal(null);coinF.reset();}
        }}/>
        <View style={{height:8}}/><PBtn title="Cancelar" onPress={()=>setModal(null)} ghost/>
      </LModal>

      {/* Bloquear cuenta */}
      <LModal visible={modal==='newLock'} title="Bloquear cuenta" onClose={()=>setModal(null)}>
        <Banner msg={error} type="error" onClose={clearMsg}/>
        <LSelect label="Cuenta a bloquear *" value={lockF.v.accountId} options={accOpts}
          onSelect={v=>{
            const acc = accounts.find(a => a.accountNumber === v);
            lockF.set('accountId', v);
            if (acc?.userId) lockF.set('userId', acc.userId);
          }} required/>
        {lockF.v.userId ? (
          <View style={{marginBottom:8}}>
            <Text style={{fontSize:11,color:C.textSub,marginBottom:4,fontWeight:FONT_WEIGHT.medium}}>
              USUARIO PROPIETARIO
            </Text>
            <View style={{backgroundColor:C.bg,borderRadius:8,padding:12,borderWidth:1,
              borderColor:C.border,flexDirection:'row',alignItems:'center',gap:8}}>
              <MaterialIcons name="person" size={16} color={C.primaryMid}/>
              <Text style={{fontSize:13,color:C.text,fontWeight:FONT_WEIGHT.medium,flex:1}}>
                {(()=>{
                  const u = users.find(u2=>(u2._uid??u2.id??u2._id)===lockF.v.userId);
                  return u ? (`${u.name??''} ${u.surname??''}`.trim()||u.username||lockF.v.userId) : lockF.v.userId;
                })()}
              </Text>
              <MaterialIcons name="lock" size={14} color={C.textMuted}/>
            </View>
          </View>
        ) : (
          <View style={{backgroundColor:C.bg,borderRadius:8,padding:12,borderWidth:1,
            borderColor:C.border,marginBottom:8,alignItems:'center'}}>
            <Text style={{fontSize:12,color:C.textMuted}}>Selecciona una cuenta primero</Text>
          </View>
        )}
        <LSelect label="Motivo del bloqueo *" value={lockF.v.lockReason} options={lockReasonOpts} onSelect={v=>lockF.set('lockReason',v)} required/>
        <LInput label="Descripción" value={lockF.v.description} onChangeText={v=>lockF.set('description',v)} multiline/>
        <LInput label="Fecha bloqueo (YYYY-MM-DD)" value={lockF.v.lockDate} onChangeText={v=>lockF.set('lockDate',v)}/>
        <LInput label="Fecha desbloqueo (YYYY-MM-DD, opcional)" value={lockF.v.unlockDate} onChangeText={v=>lockF.set('unlockDate',v)}/>
        <LSelect label="Bloqueado por (usuario)" value={lockF.v.lockedBy} options={userOpts} onSelect={v=>lockF.set('lockedBy',v)}/>
        <LSelect label="Estado" value={lockF.v.status} options={lockStatOpts} onSelect={v=>lockF.set('status',v)}/>
        <LSelect label="¿Bloqueo automático?" value={lockF.v.automatic}
          options={[{v:'false',l:'No (manual)'},{v:'true',l:'Sí (automático)'}]}
          onSelect={v=>lockF.set('automatic',v)}/>
        <LInput label="Intentos fallidos" value={lockF.v.failedAttempts} onChangeText={v=>lockF.set('failedAttempts',v)} numeric/>
        <PBtn title="Bloquear cuenta" icon="lock" loading={submitting} onPress={async()=>{
          if(!lockF.v.accountId||!lockF.v.userId||!lockF.v.lockReason){
            Alert.alert('Requerido','Selecciona cuenta, usuario y motivo.');return;}
          const toISO = d => d ? new Date(d).toISOString() : new Date().toISOString();
          // Si no se especifica unlockDate, usar fecha muy lejana
          // NUNCA usar lockDate como fallback (causaría desbloqueo inmediato)
          const unlockDate = lockF.v.unlockDate
            ? toISO(lockF.v.unlockDate)
            : '2099-12-31T23:59:59.000Z';
          const lockBody = {
            accountId:      lockF.v.accountId,
            userId:         lockF.v.userId,
            lockReason:     lockF.v.lockReason,
            description:    lockF.v.description,
            lockDate:       toISO(lockF.v.lockDate),
            unlockDate,
            lockedBy:       lockF.v.lockedBy||(storeUser?._id??storeUser?.id),
            unlockedBy:     null,
            status:         'bloqueado',
            automatic:      lockF.v.automatic==='true',
            failedAttempts: +lockF.v.failedAttempts||0,
          };
          if (__DEV__) console.log('[createLock] body:', JSON.stringify(lockBody));
          const r = await admin.createLock(lockBody);
          if (__DEV__) {
            console.log('[createLock] result:', r.success);
            console.log('[createLock] data:', JSON.stringify(r.data));
          }
          if(r.success){
            // Guardar en AsyncStorage para que el cliente lo vea
            try {
              const stored = await AsyncStorage.getItem('pb_locked_accounts');
              const locks = stored ? JSON.parse(stored) : {};
              locks[lockF.v.accountId] = true;
              await AsyncStorage.setItem('pb_locked_accounts', JSON.stringify(locks));
            } catch(e) { if(__DEV__) console.log('[lock] storage error:', e); }
            setModal(null); lockF.reset();
            addNotif({icon:'lock',color:C.error,bg:'#FEF2F2',
              title:'Cuenta bloqueada',sub:`${lockF.v.accountId} — ${lockF.v.lockReason}`});
            fetchAll();
          }
        }}/>
        <View style={{height:8}}/><PBtn title="Cancelar" onPress={()=>setModal(null)} ghost/>
      </LModal>

      {/* Nuevo depósito */}
      <LModal visible={modal==='newDeposit'} title="Nuevo depósito" onClose={()=>setModal(null)}>
        <Banner msg={error} type="error" onClose={clearMsg}/>
        <LSelect label="Cuenta destino *" value={depF.v.accountNumber} options={accOpts} onSelect={v=>depF.set('accountNumber',v)} required/>
        <LInput label="Monto *" value={depF.v.amount} onChangeText={v=>depF.set('amount',v)} numeric required/>
        <LInput label="Código moneda" value={depF.v.currencyCode} onChangeText={v=>depF.set('currencyCode',v)}/>
        <LInput label="Descripción" value={depF.v.description} onChangeText={v=>depF.set('description',v)}/>
        <PBtn title="Realizar depósito" icon="arrow-downward" loading={submitting} onPress={async()=>{
          if(!depF.v.accountNumber||!depF.v.amount){Alert.alert('Requerido','Selecciona cuenta e ingresa el monto.');return;}
          const r=await admin.createDeposit({accountNumber:depF.v.accountNumber,
            amount:+depF.v.amount,currencyCode:depF.v.currencyCode||'GTQ',description:depF.v.description});
          if(r.success){
            setModal(null);depF.reset();
            addNotif({icon:'arrow-downward',color:C.success,bg:'#F0FDF4',
              title:'Depósito realizado',sub:`${fmt(+depF.v.amount)} en ${depF.v.accountNumber}`});
          }
        }}/>
        <View style={{height:8}}/><PBtn title="Cancelar" onPress={()=>setModal(null)} ghost/>
      </LModal>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────