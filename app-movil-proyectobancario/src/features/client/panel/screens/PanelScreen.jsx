// src/features/client/panel/screens/PanelScreen.jsx
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, fmt, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../components/clientTheme.js';
import { AnimatedPressable, AccountCard } from '../../components/ClientUI.jsx';

export default function PanelScreen({
  displayName, accounts, cards, loans, favorites, filter, loading,
  notifs, onRefresh, onSetFilter, onNotifOpen, onLogout,
  onTransfer, onDeposit, onWithdrawal, onHistory,
  onGoStatements, onGoLoans, onGoTransactions,
  onToggleFavorite,
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.primary} />}>

      {/* Header saludo */}
      <View style={s.topBar}>
        <View style={{ flex:1 }}>
          <Text style={s.greet}>Hola, bienvenido</Text>
          <Text style={s.userName}>{displayName}</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => onNotifOpen()}>
          <MaterialIcons name="notifications-none" size={22} color={C.primary} />
          {notifs.length > 0 && <View style={s.notifDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={onLogout}>
          <MaterialIcons name="logout" size={22} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs Favoritas / Todas / Tarjetas */}
      <View style={s.filterRow}>
        {[
          { id:'favoritas', label:'Favoritas' },
          { id:'todas',     label:'Todas'     },
          { id:'tarjetas',  label:'Tarjetas'  },
        ].map(f => (
          <TouchableOpacity key={f.id}
            style={[s.filterBtn, filter===f.id && s.filterActive]}
            onPress={() => onSetFilter(f.id)}>
            <Text style={[s.filterTxt, filter===f.id && s.filterTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Acciones rápidas */}
      <View style={s.quickRow}>
        <AnimatedPressable style={s.quickItem} onPress={() => onWithdrawal()}>
          <View style={s.quickIcon}><MaterialIcons name="arrow-upward" size={24} color={C.primary} /></View>
          <Text style={s.quickLbl}>Retira</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.quickItem} onPress={() => onGoStatements()}>
          <View style={s.quickIcon}><MaterialIcons name="description" size={24} color={C.primary} /></View>
          <Text style={s.quickLbl}>Estados</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.quickItem} onPress={() => onGoLoans()}>
          <View style={s.quickIcon}><MaterialIcons name="attach-money" size={24} color={C.primary} /></View>
          <Text style={s.quickLbl}>Préstamos</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.quickItem} onPress={() => onTransfer()}>
          <View style={s.quickIcon}><MaterialIcons name="swap-horiz" size={24} color={C.primary} /></View>
          <Text style={s.quickLbl}>Transferir</Text>
        </AnimatedPressable>
      </View>

      {/* Transferencias recientes — navega al historial */}
      <TouchableOpacity style={s.recentRow} onPress={() => onGoTransactions()}>
        <MaterialIcons name="history" size={18} color={C.primary} />
        <Text style={s.recentTxt}>Transferencias Recientes</Text>
        <MaterialIcons name="chevron-right" size={18} color={C.textMuted} />
      </TouchableOpacity>

      {/* Tarjeta de cuenta — cambia según filtro */}
      {loading && !accounts.length
        ? <View style={{ paddingVertical:40, alignItems:'center' }}>
            <ActivityIndicator color={C.primary} />
          </View>
        : filter === 'tarjetas'
          // ── TARJETAS ──
          ? cards.length === 0
            ? <View style={s.emptyCard}>
                <MaterialIcons name="credit-card-off" size={40} color={C.textMuted} />
                <Text style={s.emptyTxt}>Sin tarjetas asignadas</Text>
              </View>
            : cards.map(c => {
                const isBlocked = c.status === 'bloqueada';
                const isCredito = c.cardType === 'credito';
                const last4     = String(c.cardNumber??'0000').slice(-4);
                const expDate   = c.expirationDate
                  ? new Date(c.expirationDate).toLocaleDateString('es-GT',{month:'2-digit',year:'2-digit'})
                  : 'N/A';
                return (
                  <View key={c._id??c.id} style={{marginHorizontal:SPACING.lg,marginBottom:SPACING.lg,
                    borderRadius:20,overflow:'hidden',
                    shadowColor:'#000',shadowOffset:{width:0,height:8},
                    shadowOpacity:0.25,shadowRadius:16,elevation:8}}>
                    {/* Frente */}
                    <View style={{padding:22,minHeight:175,
                      backgroundColor:isBlocked?'#6B7280':isCredito?C.primary:'#1E3A5F'}}>
                      {isBlocked && (
                        <View style={{position:'absolute',top:0,left:0,right:0,
                          backgroundColor:'rgba(0,0,0,0.35)',paddingVertical:5,
                          flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6}}>
                          <MaterialIcons name="lock" size={12} color="#fff"/>
                          <Text style={{color:'#fff',fontSize:10,fontWeight:FONT_WEIGHT.bold,letterSpacing:1}}>
                            TARJETA BLOQUEADA
                          </Text>
                        </View>
                      )}
                      {/* Chip + red de pago */}
                      <View style={{flexDirection:'row',justifyContent:'space-between',
                        alignItems:'flex-start',marginTop:isBlocked?24:0}}>
                        <View style={{width:38,height:28,backgroundColor:'rgba(255,215,0,0.9)',
                          borderRadius:5,justifyContent:'center',alignItems:'center'}}>
                          <View style={{width:26,height:18,borderRadius:3,borderWidth:1.5,
                            borderColor:'rgba(0,0,0,0.2)',backgroundColor:'rgba(255,215,0,0.5)'}}/>
                        </View>
                          {/* Red de pago */}
                        {(c.networkBrand??'mastercard')==='visa' ? (
                          <Text style={{color:'rgba(255,255,255,0.95)',fontSize:18,fontStyle:'italic',fontWeight:'900',letterSpacing:1}}>VISA</Text>
                        ) : (c.networkBrand??'mastercard')==='amex' ? (
                          <View style={{backgroundColor:'rgba(255,255,255,0.2)',borderRadius:4,paddingHorizontal:6,paddingVertical:2}}>
                            <Text style={{color:'#fff',fontSize:10,fontWeight:FONT_WEIGHT.bold,letterSpacing:1}}>AMEX</Text>
                          </View>
                        ) : (
                          <View style={{flexDirection:'row',alignItems:'center',gap:2}}>
                            <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#EB001B',opacity:0.9}}/>
                            <View style={{width:22,height:22,borderRadius:11,backgroundColor:'#F79E1B',opacity:0.9,marginLeft:-10}}/>
                            <Text style={{color:'#fff',fontSize:9,fontWeight:FONT_WEIGHT.bold,marginLeft:4,letterSpacing:0.5}}>Mastercard</Text>
                          </View>
                        )}
                      </View>
                      {/* Número */}
                      <Text style={{fontSize:17,color:'#fff',letterSpacing:4,
                        marginTop:18,fontWeight:FONT_WEIGHT.bold}}>
                        {isBlocked?'•••• •••• •••• ••••':`•••• •••• •••• ${last4}`}
                      </Text>
                      {/* Titular + vencimiento */}
                      <View style={{flexDirection:'row',justifyContent:'space-between',
                        alignItems:'flex-end',marginTop:14}}>
                        <View>
                          <Text style={{fontSize:8,color:'rgba(255,255,255,0.5)',letterSpacing:1,marginBottom:2}}>TITULAR</Text>
                          <Text style={{fontSize:11,color:'#fff',fontWeight:FONT_WEIGHT.semibold,
                            textTransform:'uppercase',letterSpacing:0.5}}>
                            {displayName.toUpperCase()}
                          </Text>
                        </View>
                        <View style={{alignItems:'flex-end'}}>
                          <Text style={{fontSize:8,color:'rgba(255,255,255,0.5)',letterSpacing:1,marginBottom:2}}>VENCE</Text>
                          <Text style={{fontSize:12,color:'#fff',fontWeight:FONT_WEIGHT.semibold}}>{expDate}</Text>
                        </View>
                      </View>
                    </View>
                    {/* Panel inferior */}
                    <View style={{backgroundColor:C.surface,paddingHorizontal:22,paddingVertical:12,
                      flexDirection:'row',justifyContent:'space-between',alignItems:'center',
                      borderTopWidth:1,borderTopColor:C.border}}>
                      <View>
                        <Text style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Balance</Text>
                        <Text style={{fontSize:18,fontWeight:FONT_WEIGHT.bold,
                          color:isBlocked?C.textMuted:C.primary}}>
                          {isBlocked?'——':fmt(c.availableBalance??0)}
                        </Text>
                      </View>
                      <View style={{backgroundColor:isBlocked?'#FEF2F2':isCredito?'#EFF6FF':'#F0FDF4',
                        paddingHorizontal:10,paddingVertical:4,borderRadius:99}}>
                        <Text style={{fontSize:10,fontWeight:FONT_WEIGHT.bold,
                          color:isBlocked?C.error:isCredito?C.primary:'#0D9488'}}>
                          {isBlocked?'BLOQUEADA':isCredito?'CRÉDITO':'DÉBITO'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
          : (() => {
              // ── CUENTAS (favoritas o todas) ──
              const lista = filter === 'favoritas'
                ? accounts.filter(a => favorites.includes(a.accountNumber))
                : accounts;
              return lista.length === 0
                ? <View style={s.emptyCard}>
                    <MaterialIcons name={filter==='favoritas'?'star-border':'account-balance'} size={40} color={C.textMuted} />
                    <Text style={s.emptyTxt}>{filter==='favoritas' ? 'Sin cuentas favoritas' : 'Sin cuentas registradas'}</Text>
                    <Text style={s.emptySub}>{filter==='favoritas' ? 'Toca ★ en una cuenta para marcarla' : 'Contacta al administrador'}</Text>
                  </View>
                : lista.map(acc => {
                    const tipo   = (acc.accountType??acc.type??'Cuenta').toUpperCase();
                    const numero = acc.accountNumber??'—';
                    const bal    = acc.balance??acc.availableBalance??0;
                    const isFav  = favorites.includes(acc.accountNumber);
                    return (
                      <AccountCard key={numero} acc={acc}
                        displayName={displayName}
                        style={{marginHorizontal:SPACING.lg}}
                        showFavorite isFav={isFav} onFavorite={()=>onToggleFavorite(acc.accountNumber)}
                        onTransfer={()=>onTransfer()}
                        onHistory={()=>{onHistory(acc)}}
                        onDeposit={()=>onDeposit()}/>
                    );
                  });
            })()
      }

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}
