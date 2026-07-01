// src/features/client/withdrawals/screens/WithdrawalsScreen.jsx
import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Platform, TouchableOpacity, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, fmt, hist, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../components/clientTheme.js';
import { LInput, LSelect, PBtn } from '../../components/ClientUI.jsx';

export default function WithdrawalsScreen({
    withdrawals, accounts, loading, submitting,
    onWithdrawal, onRefresh, onBack,
}) {
    const accOpts = accounts.filter(a => (a._displayStatus ?? a.status) === 'activa')
        .map(a => ({ v: a.accountNumber, l: `${a.accountNumber} — ${fmt(a.balance)}` }));
    const [retForm, setRetForm] = useState({ accountNumber: '', amount: '' });
    const setRet = (k, v) => setRetForm(p => ({ ...p, [k]: v }));
    const selAcc = accounts.find(a => a.accountNumber === retForm.accountNumber);

    const handleWithdrawal = async () => {
        Keyboard.dismiss();
        if (!retForm.accountNumber || !retForm.amount) {
            Alert.alert('Campos requeridos', 'Selecciona una cuenta e ingresa el monto.'); return;
        }
        const r = await onWithdrawal(retForm);
        if (r.success) {

            setRetForm({ accountNumber: '', amount: '' });

        }
    };

    const COLS = ['Nº Cuenta', 'Monto', 'Bal. Anterior', 'Bal. Nuevo', 'Descripción', 'Estado', 'Fecha'];

    return (
        <View style={{ flex: 1 }}>
            <View style={hist.header}>
                <TouchableOpacity onPress={() => onBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="arrow-back" size={22} color={C.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.pageTitle}>Retiros</Text>
                    <Text style={s.pageSub}>Historial de retiros en tus cuentas</Text>
                </View>
            </View>
            <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading}
                    onRefresh={() => { onRefresh(); fetchWithdrawals(accounts); }}
                    tintColor={C.primary} />}>
                <View style={[s.listCard, SHADOWS.sm, { marginBottom: SPACING.lg }]}>
                    <Text style={hist.formTitle}>Nuevo retiro</Text>
                    <LSelect label="Cuenta origen *" value={retForm.accountNumber}
                        options={accOpts} onSelect={v => setRet('accountNumber', v)} required />
                    {selAcc && (
                        <View style={s.infoBox}>
                            <MaterialIcons name="info-outline" size={14} color={C.primaryMid} />
                            <Text style={s.infoTxt}>
                                Balance: {fmt(selAcc.balance)} · Límite diario: {fmt(selAcc.dailyWithdrawalLimit)}
                            </Text>
                        </View>
                    )}
                    <LInput label="Monto *" value={retForm.amount}
                        onChangeText={v => setRet('amount', v)} numeric required />
                    <View style={{ height: SPACING.md }} />
                    <PBtn title="Realizar retiro" icon="arrow-upward" onPress={handleWithdrawal} loading={submitting} />
                </View>
                <View style={[hist.tableCard, SHADOWS.sm]}>
                    <View style={hist.tableTitle}>
                        <Text style={hist.tableTitleTxt}>Mis retiros ({withdrawals.length})</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}
                        nestedScrollEnabled={true} scrollEventThrottle={16}
                        directionalLockEnabled={false} keyboardShouldPersistTaps="handled"
                        style={Platform.OS === 'web' ? { overflowX: 'auto', overflowY: 'visible' } : {}}>
                        <View>
                            <View style={hist.thead}>
                                {COLS.map(h => <Text key={h} style={hist.th}>{h}</Text>)}
                            </View>
                            {withdrawals.length === 0
                                ? <View style={hist.emptyRow}>
                                    <MaterialIcons name="arrow-upward" size={32} color={C.textMuted} />
                                    <Text style={hist.emptyTxt}>Sin retiros registrados</Text>
                                </View>
                                : (() => {
                                    // Calcular balances: ordenar por fecha desc y calcular acumulado
                                    const sorted = [...withdrawals].sort((a, b) =>
                                        new Date(b.date ?? b.createdAt ?? 0) - new Date(a.date ?? a.createdAt ?? 0));
                                    // Balance actual de la cuenta del retiro
                                    const getAccBal = accNum => {
                                        const acc = accounts.find(a => a.accountNumber === accNum);
                                        return acc?.balance ?? 0;
                                    };
                                    // Acumular: el más reciente tiene balance actual, los anteriores suman
                                    const accTotals = {}; // {accountNumber: runningBalance}
                                    return sorted.map((w, i) => {
                                        const accNum = w.accountNumber;
                                        if (!(accNum in accTotals)) accTotals[accNum] = getAccBal(accNum);
                                        const balNew = accTotals[accNum];
                                        const balPrev = balNew + (w.amount ?? 0);
                                        accTotals[accNum] = balPrev; // siguiente retiro tiene este como nuevo
                                        return (
                                            <View key={w._id ?? i} style={[hist.tr, i % 2 === 1 && hist.trAlt]}>
                                                <Text style={[hist.td, hist.tdAcc, hist.colAcc]}>{w.accountNumber}</Text>
                                                <Text style={[hist.td, hist.tdAmount, hist.colMonto]}>-{fmt(w.amount)}</Text>
                                                <Text style={[hist.td, hist.colNum, { color: C.textSub }]}>{fmt(balPrev)}</Text>
                                                <Text style={[hist.td, hist.colNum, { color: C.warning, fontWeight: FONT_WEIGHT.semibold }]}>{fmt(balNew)}</Text>
                                                <Text style={[hist.td, hist.colDesc]} numberOfLines={2}>{w.description ?? '—'}</Text>
                                                <View style={hist.colEstado}>
                                                    <View style={[hist.statusPill, { backgroundColor: '#F0FDF4' }]}>
                                                        <Text style={[hist.statusTxt, { color: C.success }]}>{w.status ?? 'Exitosa'}</Text>
                                                    </View>
                                                </View>
                                                <Text style={[hist.td, hist.colFecha, { color: C.textMuted }]}>
                                                    {w.date ?? w.createdAt ? new Date(w.date ?? w.createdAt).toLocaleDateString('es-GT') : '—'}
                                                </Text>
                                            </View>
                                        );
                                    });
                                })()
                            }
                        </View>
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
}