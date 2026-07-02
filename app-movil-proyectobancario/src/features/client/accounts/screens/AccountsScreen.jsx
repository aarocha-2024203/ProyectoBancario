// src/features/client/accounts/screens/AccountsScreen.jsx
import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../components/clientTheme.js';
import { AccountCard } from '../../components/ClientUI.jsx';

export default function AccountsScreen({
  accounts, displayName, loading, onRefresh,
  onTransfer, onHistory, onDeposit,
}) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: SPACING.xxl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.primary} />}>

      {/* Header */}
      <View style={{ paddingHorizontal:SPACING.lg, paddingTop:SPACING.lg, paddingBottom:SPACING.md }}>
        <Text style={s.pageTitle}>Mis Cuentas</Text>
        <Text style={s.pageSub}>Estado de todas tus cuentas bancarias</Text>
      </View>

      {/* Stats row — diseño mejorado con íconos */}
      <View style={{ flexDirection:'row', gap:SPACING.sm, paddingHorizontal:SPACING.lg, marginBottom:SPACING.lg }}>
        {[
          { l:'Total',      v:accounts.length,                                   c:C.primary,    bg:'#EFF6FF', icon:'account-balance'  },
          { l:'Activas',    v:accounts.filter(a=>(a._displayStatus??a.status)==='activa').length,    c:'#0D9488',    bg:'#F0FDFA', icon:'check-circle'      },
          { l:'Bloqueadas', v:accounts.filter(a=>(a._displayStatus??a.status)==='bloqueada').length, c:'#B45309',    bg:'#FFFBEB', icon:'lock'              },
          { l:'Inactivas',  v:accounts.filter(a=>(a._displayStatus??a.status)==='inactiva').length,  c:'#6B7280',    bg:'#F3F4F6', icon:'pause-circle'      },
        ].map((st,i) => (
          <View key={i} style={{ flex:1, backgroundColor:st.bg, borderRadius:12,
            padding:SPACING.sm+2, alignItems:'center', gap:4,
            borderWidth:1, borderColor:st.c+'22' }}>
            <View style={{ width:32, height:32, borderRadius:16,
              backgroundColor:st.c+'18', justifyContent:'center', alignItems:'center' }}>
              <MaterialIcons name={st.icon} size={16} color={st.c}/>
            </View>
            <Text style={{ fontSize:FONT_SIZE.lg, fontWeight:FONT_WEIGHT.bold, color:st.c }}>{st.v}</Text>
            <Text style={{ fontSize:9, color:st.c+'BB', fontWeight:FONT_WEIGHT.medium, textAlign:'center' }}>{st.l}</Text>
          </View>
        ))}
      </View>

      {/* Lista estilo BI */}
      <View style={{ paddingHorizontal:SPACING.lg, marginTop:SPACING.md }}>
        {accounts.length === 0 ? (
          <View style={s.emptyCard}>
            <MaterialIcons name="account-balance" size={44} color={C.textMuted} />
            <Text style={s.emptyTxt}>Sin cuentas registradas</Text>
            <Text style={s.emptySub}>Contacta al administrador para abrir una cuenta</Text>
          </View>
        ) : (
          accounts.map(acc => <AccountCard key={acc.accountNumber??acc._id} acc={acc}
            displayName={displayName}
            onTransfer={()=>onTransfer()}
            onHistory={()=>{onHistory(acc)}}
            onDeposit={()=>onDeposit()}/>)
        )}
      </View>
    </ScrollView>
  );
}
