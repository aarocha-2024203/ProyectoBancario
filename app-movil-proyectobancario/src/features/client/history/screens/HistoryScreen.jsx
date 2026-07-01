// src/features/client/history/screens/HistoryScreen.jsx
import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, pb, fmt, fmtMonto, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../components/clientTheme.js';
import { Badge } from '../../components/ClientUI.jsx';

export default function HistoryScreen({
  selectedAcc, accounts, transactions, deposits, withdrawals,
  loans, savedVouchers, loading, onRefresh, onBack,
}) {
  const acc = selectedAcc;

    if (!acc) return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',gap:16}}>
        <MaterialIcons name="receipt-long" size={48} color={C.textMuted}/>
        <Text style={{color:C.textSub,fontSize:FONT_SIZE.md}}>Selecciona una cuenta primero</Text>
        <TouchableOpacity style={[pb.btn,{paddingHorizontal:24}]} onPress={()=>onBack()}>
          <Text style={pb.lbl}>Ir a Mis Cuentas</Text>
        </TouchableOpacity>
      </View>
    );

    const accNum = acc.accountNumber;

    // Transacciones: el backend no devuelve tx al cliente via GET /transaction/
    // Usamos savedVouchers (guardados localmente al hacer transferencias desde la app)
    // + transactions del servidor si acaso devuelve algo
    const txsServer = transactions.filter(t =>
      t.sourceAccountId===accNum || t.destinationAccountId===accNum);
    const txsLocal  = savedVouchers.filter(v =>
      v.source===accNum || v.destination===accNum);
    // Unir sin duplicados
    const txsCombined = [
      ...txsLocal.map(v=>({
        id: v.id??v.authCode,
        tipo: 'Transferencia', icono:'swap-horiz', color:C.primaryMid,
        monto: v.source===accNum ? -(v.amount??0) : +(v.amount??0),
        moneda: v.currency??'GTQ',
        desc: v.description || v.alias || '—',
        fecha: v.date, estado:'exitosa',
      })),
      ...txsServer
        .filter(t => !txsLocal.find(v =>
          v.source===t.sourceAccountId &&
          v.destination===t.destinationAccountId &&
          Math.abs((v.amount??0)-(t.amount??0))<0.01))
        .map(t=>({
          id:t._id??t.id, tipo:'Transferencia', icono:'swap-horiz', color:C.primaryMid,
          monto: t.sourceAccountId===accNum ? -(t.amount??0) : +(t.amount??0),
          moneda: t.currencyId??t.currency??'GTQ',
          desc: t.description??'—', fecha: t.transactionDate??t.createdAt,
          estado: t.status??'exitosa',
        })),
    ];

    const wds  = withdrawals.filter(w => w.accountNumber===accNum);
    const deps = deposits.filter(d => d.accountNumber===accNum);
    const lns  = loans.filter(l => l.accountNumber===accNum || l.account===accNum);

    const movimientos = [
      ...txsCombined,
      ...wds.map(w=>({
        id:w._id??w.id, tipo:'Retiro', icono:'arrow-upward', color:C.error,
        monto: -(w.amount??0),
        moneda: w.currencyCode??w.currency??'GTQ',
        desc: w.description??'Retiro', fecha: w.createdAt??w.date??w.withdrawalDate,
        estado: w.status??'exitosa',
      })),
      ...deps.map(d=>({
        id:d._id??d.id, tipo:'Depósito', icono:'arrow-downward', color:C.success,
        monto: +(d.amount??0),
        moneda: d.currencyCode??d.currency??'GTQ',
        desc: d.description??'Depósito', fecha: d.createdAt??d.date??d.depositDate,
        estado: d.status??'exitosa',
      })),
      ...lns.map(l=>({
        id:l._id??l.id, tipo:'Préstamo', icono:'attach-money', color:'#7C3AED',
        monto: +(l.amount??l.loanAmount??0),
        desc: `Préstamo${l.description?' — '+l.description:''}`,
        moneda: l.currencyCode??l.currency??'GTQ',
        fecha: l.startDate??l.createdAt, estado: l.status??'activo',
      })),
    ].sort((a,b)=>new Date(b.fecha??0)-new Date(a.fecha??0));

    return (
      <View style={{flex:1}}>
      <ScrollView contentContainerStyle={{padding:SPACING.lg,paddingBottom:40}}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading}
          onRefresh={onRefresh}
          tintColor={C.primary}/>}>
        <TouchableOpacity style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:SPACING.lg}}
          onPress={()=>onBack()}>
          <MaterialIcons name="arrow-back" size={20} color={C.primary}/>
          <Text style={{fontSize:FONT_SIZE.sm,color:C.primary,fontWeight:FONT_WEIGHT.medium}}>Volver</Text>
        </TouchableOpacity>

        <View style={[s.biCard,{marginBottom:SPACING.lg}]}>
          <View style={s.biCardHeader}>
            <View style={{flex:1}}>
              <Text style={s.biCardType}>{`CUENTA ${(acc.accountType??'cuenta').toUpperCase()}`}</Text>
              <Text style={s.biCardNum}>{accNum}</Text>
            </View>
            <View style={{alignItems:'flex-end',gap:4}}>
              <Badge status={acc._displayStatus??acc.status??'activa'}/>
              <Text style={[s.biBalVal,{fontSize:18}]}>{fmt(acc.balance??0)}</Text>
              <Text style={s.biBalLbl}>saldo</Text>
            </View>
          </View>
        </View>

        <Text style={{fontSize:FONT_SIZE.lg,fontWeight:FONT_WEIGHT.bold,color:C.text,marginBottom:SPACING.md}}>
          Movimientos ({movimientos.length})
        </Text>

        {movimientos.length===0 ? (
          <View style={[s.emptyCard,{marginTop:0}]}>
            <MaterialIcons name="receipt" size={40} color={C.textMuted}/>
            <Text style={s.emptyTxt}>Sin movimientos</Text>
            <Text style={s.emptySub}>Las transacciones de esta cuenta aparecerán aquí</Text>
          </View>
        ) : movimientos.map((m,i) => (
          <View key={m.id??i} style={{
            backgroundColor:C.surface, borderRadius:12, padding:SPACING.md,
            marginBottom:SPACING.sm, flexDirection:'row', alignItems:'center',
            gap:SPACING.md, borderWidth:1, borderColor:C.border,
          }}>
            <View style={{width:40,height:40,borderRadius:20,
              backgroundColor:m.monto>=0?'#F0FDF4':'#FEF2F2',
              justifyContent:'center',alignItems:'center'}}>
              <MaterialIcons name={m.icono} size={20} color={m.color}/>
            </View>
            <View style={{flex:1}}>
              <Text style={{fontSize:FONT_SIZE.sm,fontWeight:FONT_WEIGHT.semibold,color:C.text}}>
                {m.tipo}
              </Text>
              <Text style={{fontSize:FONT_SIZE.xs,color:C.textSub}} numberOfLines={1}>{m.desc}</Text>
              <Text style={{fontSize:10,color:C.textMuted}}>
                {m.fecha ? new Date(m.fecha).toLocaleDateString('es-GT',
                  {day:'2-digit',month:'short',year:'numeric'}) : '—'}
              </Text>
            </View>
            <Text style={{fontSize:FONT_SIZE.md,fontWeight:FONT_WEIGHT.bold,
              color:m.monto>=0?C.success:C.error}}>
              {fmtMonto(m.monto, m.moneda)}
            </Text>
          </View>
        ))}
      </ScrollView>
      </View>
    );
}
