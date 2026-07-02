// src/features/client/cards/screens/CardsScreen.jsx
import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, fmt, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../components/clientTheme.js';

export default function CardsScreen({ cards, displayName, loading, onRefresh }) {
  const activas    = cards.filter(c=>c.status==='activa').length;
    const bloqueadas = cards.filter(c=>c.status==='bloqueada').length;
    const totalBal   = cards.reduce((s,c)=>s+(c.availableBalance??0),0);
    return (
      <ScrollView contentContainerStyle={{paddingBottom:SPACING.xxl}}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.primary}/>}>

      {/* Header */}
      <View style={{paddingHorizontal:SPACING.lg,paddingTop:SPACING.lg,paddingBottom:SPACING.md}}>
        <Text style={s.pageTitle}>Mis Tarjetas</Text>
        <Text style={s.pageSub}>Crédito y débito</Text>
      </View>

      {/* Stats — estilo horizontal con línea divisora */}
      <View style={{backgroundColor:C.surface,marginHorizontal:SPACING.lg,borderRadius:14,
        borderWidth:1,borderColor:C.border,flexDirection:'row',marginBottom:SPACING.lg,overflow:'hidden'}}>
        {[
          {l:'Total',     v:cards.length,            c:C.primary,   icon:'credit-card'},
          {l:'Activas',   v:activas,                 c:'#0D9488',   icon:'check-circle'},
          {l:'Bloqueadas',v:bloqueadas,              c:'#B45309',   icon:'lock'},
          {l:'Balance',   v:fmt(totalBal),           c:C.primaryMid,icon:'account-balance-wallet'},
        ].map((st,i,arr)=>(
          <View key={i} style={{flex:i===3?2:1,padding:12,alignItems:'center',gap:4,
            borderRightWidth:i<arr.length-1?1:0,borderRightColor:C.border}}>
            <MaterialIcons name={st.icon} size={18} color={st.c}/>
            <Text style={{fontSize:i===3?11:FONT_SIZE.lg,fontWeight:FONT_WEIGHT.bold,color:st.c,
              textAlign:'center'}}>{st.v}</Text>
            <Text style={{fontSize:9,color:C.textMuted,textAlign:'center',fontWeight:FONT_WEIGHT.medium}}>
              {st.l}
            </Text>
          </View>
        ))}
      </View>

      {/* Tarjetas */}
      <View style={{paddingHorizontal:SPACING.lg,gap:SPACING.lg}}>
        {cards.length===0 ? (
          <View style={s.emptyCard}>
            <MaterialIcons name="credit-card-off" size={44} color={C.textMuted}/>
            <Text style={s.emptyTxt}>Sin tarjetas asignadas</Text>
            <Text style={s.emptySub}>Contacta al administrador</Text>
          </View>
        ) : cards.map(c=>{
          const isBlocked  = c.status==='bloqueada';
          const isCredito  = c.cardType==='credito';
          const last4      = String(c.cardNumber??'0000').slice(-4);
          const expDate    = c.expirationDate
            ? new Date(c.expirationDate).toLocaleDateString('es-GT',{month:'2-digit',year:'2-digit'})
            : 'N/A';

          return (
            <View key={c._id??c.id} style={{borderRadius:20,overflow:'hidden',
              shadowColor:'#000',shadowOffset:{width:0,height:8},
              shadowOpacity:0.25,shadowRadius:16,elevation:8}}>
              {/* Frente de la tarjeta */}
              <View style={{
                padding:24,minHeight:180,
                backgroundColor: isBlocked
                  ? '#6B7280'
                  : isCredito ? C.primary : '#1E3A5F',
              }}>
                {/* Banda bloqueada */}
                {isBlocked && (
                  <View style={{position:'absolute',top:0,left:0,right:0,
                    backgroundColor:'rgba(0,0,0,0.35)',paddingVertical:6,
                    flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6}}>
                    <MaterialIcons name="lock" size={13} color="#fff"/>
                    <Text style={{color:'#fff',fontSize:11,fontWeight:FONT_WEIGHT.bold,letterSpacing:1}}>
                      TARJETA BLOQUEADA
                    </Text>
                  </View>
                )}

                {/* Chip + red de pago */}
                <View style={{flexDirection:'row',justifyContent:'space-between',
                  alignItems:'flex-start',marginTop:isBlocked?28:0}}>
                  <View style={{width:40,height:30,backgroundColor:'rgba(255,215,0,0.9)',
                    borderRadius:6,justifyContent:'center',alignItems:'center'}}>
                    <View style={{width:28,height:20,borderRadius:3,borderWidth:1.5,
                      borderColor:'rgba(0,0,0,0.2)',backgroundColor:'rgba(255,215,0,0.6)'}}/>
                  </View>
                  {(c.networkBrand??'mastercard')==='visa' ? (
                    <Text style={{color:'rgba(255,255,255,0.95)',fontSize:20,fontStyle:'italic',
                      fontWeight:'900',letterSpacing:1}}>VISA</Text>
                  ) : (c.networkBrand??'mastercard')==='amex' ? (
                    <View style={{backgroundColor:'rgba(255,255,255,0.2)',borderRadius:4,
                      paddingHorizontal:7,paddingVertical:3}}>
                      <Text style={{color:'#fff',fontSize:11,fontWeight:FONT_WEIGHT.bold,letterSpacing:1}}>AMEX</Text>
                    </View>
                  ) : (
                    <View style={{flexDirection:'row',alignItems:'center',gap:2}}>
                      <View style={{width:24,height:24,borderRadius:12,backgroundColor:'#EB001B',opacity:0.9}}/>
                      <View style={{width:24,height:24,borderRadius:12,backgroundColor:'#F79E1B',opacity:0.9,marginLeft:-10}}/>
                      <Text style={{color:'#fff',fontSize:9,fontWeight:FONT_WEIGHT.bold,
                        marginLeft:4,letterSpacing:0.5}}>Mastercard</Text>
                    </View>
                  )}
                </View>

                {/* Número */}
                <Text style={{fontSize:18,color:'#fff',letterSpacing:4,
                  fontFamily:'monospace',marginTop:20,fontWeight:FONT_WEIGHT.bold}}>
                  {isBlocked ? '•••• •••• •••• ••••' : `•••• •••• •••• ${last4}`}
                </Text>

                {/* Footer tarjeta */}
                <View style={{flexDirection:'row',justifyContent:'space-between',
                  alignItems:'flex-end',marginTop:16}}>
                  <View>
                    <Text style={{fontSize:8,color:'rgba(255,255,255,0.5)',letterSpacing:1,marginBottom:2}}>
                      TITULAR
                    </Text>
                    <Text style={{fontSize:12,color:'#fff',fontWeight:FONT_WEIGHT.semibold,
                      textTransform:'uppercase',letterSpacing:0.5}}>
                      {displayName.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={{fontSize:8,color:'rgba(255,255,255,0.5)',letterSpacing:1,marginBottom:2}}>
                      VENCE
                    </Text>
                    <Text style={{fontSize:13,color:'#fff',fontWeight:FONT_WEIGHT.semibold}}>
                      {expDate}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Panel inferior — balance */}
              <View style={{backgroundColor:C.surface,paddingHorizontal:24,paddingVertical:14,
                flexDirection:'row',justifyContent:'space-between',alignItems:'center',
                borderTopWidth:1,borderTopColor:C.border}}>
                <View>
                  <Text style={{fontSize:10,color:C.textMuted,marginBottom:2}}>Balance disponible</Text>
                  <Text style={{fontSize:20,fontWeight:FONT_WEIGHT.bold,
                    color:isBlocked?C.textMuted:C.primary}}>
                    {isBlocked ? '——' : fmt(c.availableBalance??0)}
                  </Text>
                </View>
                <View style={{alignItems:'flex-end',gap:4}}>
                  <View style={{backgroundColor:isBlocked?'#FEF2F2':isCredito?'#EFF6FF':'#F0FDF4',
                    paddingHorizontal:10,paddingVertical:4,borderRadius:99}}>
                    <Text style={{fontSize:10,fontWeight:FONT_WEIGHT.bold,
                      color:isBlocked?C.error:isCredito?C.primary:'#0D9488'}}>
                      {isBlocked?'BLOQUEADA':isCredito?'CRÉDITO':'DÉBITO'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <View style={{height:SPACING.xl}}/>
    </ScrollView>
    );
}
