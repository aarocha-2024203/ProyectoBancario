// src/features/client/transactions/screens/TransactionsScreen.jsx
import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, pb, fmt, fmtMonto, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../components/clientTheme.js';

export default function TransactionsScreen({
  transactions, savedVouchers, accounts, displayName,
  loading, onRefresh, onNewTransfer, onViewVoucher, onShare, onBack,
}) {
  // Combinar savedVouchers (locales) con transactions del servidor
    const fmtD = d => d ? new Date(d).toLocaleDateString('es-GT',
      {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

    // Unir: primero los vouchers guardados localmente, luego los del servidor que no estén
    const serverTxs = transactions.map(tx => ({
      id:          tx._id ?? tx.id,
      authCode:    (tx._id ?? tx.id ?? '').slice(-10).toUpperCase(),
      date:        tx.transactionDate ?? tx.createdAt,
      source:      tx.sourceAccountId,
      destination: tx.destinationAccountId,
      amount:      tx.amount,
      currency:    tx.currencyId ?? 'GTQ',
      description: tx.description ?? tx.alias ?? '',
      alias:       tx.alias ?? '',
      sourceName:  displayName,
      fromServer:  true,
    }));

    // Mezclar: vouchers guardados primero, luego transacciones del servidor no duplicadas
    const allTx = [
      ...savedVouchers,
      ...serverTxs.filter(st => !savedVouchers.find(sv =>
        sv.source === st.source &&
        sv.destination === st.destination &&
        Math.abs(sv.amount - st.amount) < 0.01
      )),
    ].sort((a,b) => new Date(b.date) - new Date(a.date));

    return (
    <ScrollView contentContainerStyle={{padding:SPACING.lg,paddingBottom:SPACING.xxl}}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.primary}/>}>

      <View style={{flexDirection:'row',alignItems:'center',gap:SPACING.sm,marginBottom:4}}>
        <TouchableOpacity onPress={()=>onBack()} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <MaterialIcons name="arrow-back" size={22} color={C.primary}/>
        </TouchableOpacity>
        <Text style={s.pageTitle}>Mis Transferencias</Text>
      </View>
      <Text style={s.pageSub}>{allTx.length} transferencia{allTx.length!==1?'s':''}</Text>

      <TouchableOpacity style={[pb.btn,{marginBottom:SPACING.lg,marginTop:SPACING.sm}]}
        onPress={()=>onNewTransfer()} activeOpacity={0.85}>
        <MaterialIcons name="add" size={18} color="#fff"/>
        <Text style={pb.lbl}>Nueva transferencia</Text>
      </TouchableOpacity>

      {allTx.length===0 ? (
        <View style={s.emptyCard}>
          <MaterialIcons name="swap-horiz" size={44} color={C.textMuted}/>
          <Text style={s.emptyTxt}>Sin transferencias</Text>
          <Text style={s.emptySub}>Tus transferencias aparecerán aquí</Text>
        </View>
      ) : allTx.map((tx,i) => {
        const isOut = accounts.some(a => a.accountNumber === tx.source);
        const txDate = typeof tx.date === 'string' ? new Date(tx.date) : tx.date;
        return (
          <View key={tx.id??tx.authCode??i} style={{
            backgroundColor:C.surface, borderRadius:16, marginBottom:SPACING.md,
            borderWidth:1, borderColor:C.border, overflow:'hidden',
            shadowColor:'#000', shadowOffset:{width:0,height:2},
            shadowOpacity:0.06, shadowRadius:8, elevation:2,
          }}>
            {/* Header de la card */}
            <View style={{flexDirection:'row',alignItems:'center',padding:SPACING.md,gap:SPACING.md}}>
              <View style={{width:46,height:46,borderRadius:23,
                backgroundColor:isOut?'#EFF6FF':'#F0FDF4',
                justifyContent:'center',alignItems:'center',
                borderWidth:1,borderColor:isOut?'#BFDBFE':'#A7F3D0'}}>
                <MaterialIcons name={isOut?'arrow-upward':'arrow-downward'}
                  size={22} color={isOut?C.primaryMid:C.success}/>
              </View>
              <View style={{flex:1}}>
                <Text style={{fontSize:FONT_SIZE.sm,fontWeight:FONT_WEIGHT.bold,color:C.text}}>
                  {tx.description || tx.alias || 'Transferencia'}
                </Text>
                <Text style={{fontSize:10,color:C.textMuted,marginTop:3}}>
                  {fmtD(txDate)}
                </Text>
              </View>
              <Text style={{fontSize:FONT_SIZE.lg,fontWeight:FONT_WEIGHT.bold,
                color:isOut?C.primaryMid:C.success}}>
                {fmtMonto(isOut?-(tx.amount??0):+(tx.amount??0), tx.currency??'GTQ')}
              </Text>
            </View>

            {/* Detalles */}
            <View style={{backgroundColor:'#F8FAFC',paddingHorizontal:SPACING.md,paddingVertical:10,
              borderTopWidth:1,borderTopColor:C.border,gap:6}}>
              <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
                <MaterialIcons name="arrow-circle-right" size={13} color={C.textMuted}/>
                <Text style={{fontSize:11,color:C.textSub,flex:1}}>
                  <Text style={{color:C.textMuted}}>De: </Text>
                  <Text style={{fontWeight:FONT_WEIGHT.semibold}}>{tx.source}</Text>
                </Text>
              </View>
              <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
                <MaterialIcons name="arrow-circle-left" size={13} color={C.textMuted}/>
                <Text style={{fontSize:11,color:C.textSub,flex:1}}>
                  <Text style={{color:C.textMuted}}>Para: </Text>
                  <Text style={{fontWeight:FONT_WEIGHT.semibold}}>
                    {tx.alias ? `${tx.alias} (${tx.destination})` : tx.destination}
                  </Text>
                </Text>
              </View>
              <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
                <MaterialIcons name="tag" size={13} color={C.textMuted}/>
                <Text style={{fontSize:11,color:C.textSub}}>
                  <Text style={{color:C.textMuted}}>Ref: </Text>
                  <Text style={{fontWeight:FONT_WEIGHT.semibold,letterSpacing:0.5}}>
                    {tx.authCode}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Acciones */}
            <View style={{flexDirection:'row',borderTopWidth:1,borderTopColor:C.border}}>
              <TouchableOpacity
                style={{flex:1,paddingVertical:11,flexDirection:'row',
                  alignItems:'center',justifyContent:'center',gap:5}}
                onPress={()=>{
                  onViewVoucher({...tx, date: txDate});
                }}>
                <MaterialIcons name="receipt-long" size={15} color={C.primary}/>
                <Text style={{fontSize:12,color:C.primary,fontWeight:FONT_WEIGHT.semibold}}>
                  Ver voucher
                </Text>
              </TouchableOpacity>
              <View style={{width:1,backgroundColor:C.border}}/>
              <TouchableOpacity
                style={{flex:1,paddingVertical:11,flexDirection:'row',
                  alignItems:'center',justifyContent:'center',gap:5}}
                onPress={async()=>{
                  const txt = [
                    'VOUCHER DE TRANSFERENCIA',
                    '─────────────────────────',
                    `Código: ${tx.authCode}`,
                    `Fecha:  ${fmtD(txDate)}`,
                    `De:     ${tx.source}`,
                    `Para:   ${tx.alias||''} ${tx.destination}`,
                    `Monto:  ${tx.currency} ${fmt(tx.amount)}`,
                    tx.description ? `Nota:   ${tx.description}` : '',
                    '─────────────────────────',
                    'Sistema Bancario Kinal',
                  ].filter(Boolean).join('\n');
                  try {
                    if (navigator?.clipboard) {
                      await navigator.clipboard.writeText(txt);
                      addNotif({icon:'share',color:C.success,bg:'#F0FDF4',
                        title:'Voucher copiado',sub:'Listo para compartir'});
                    }
                  } catch {}
                }}>
                <MaterialIcons name="share" size={15} color={C.primaryMid}/>
                <Text style={{fontSize:12,color:C.primaryMid,fontWeight:FONT_WEIGHT.semibold}}>
                  Compartir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
    );
}
