// src/features/client/deposits/screens/DepositsScreen.jsx
import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert, Platform, TouchableOpacity, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, fmt, hist, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../components/clientTheme.js';
import { LInput, LSelect, PBtn } from '../../components/ClientUI.jsx';

export default function DepositsScreen({
    deposits, accounts, coins, loading, submitting,
    onDeposit, onRefresh, onBack,
}) {
    const accOpts = accounts.filter(a => (a._displayStatus ?? a.status) === 'activa')
        .map(a => ({ v: a.accountNumber, l: `${a.accountNumber} — ${fmt(a.balance)}` }));
    // coins ya viene procesado como coinOpts desde ClientDashboard {v, l, rate}
    const coinOpts = coins.length > 0 ? coins
        : [{ v: 'GTQ', l: 'Quetzal (GTQ)' }, { v: 'USD', l: 'Dólar (USD)' }, { v: 'EUR', l: 'Euro (EUR)' }];
    const [depForm, setDepForm] = useState({ accountNumber: '', amount: '', currencyCode: 'GTQ', description: '' });
    const setDep = (k, v) => setDepForm(p => ({ ...p, [k]: v }));

    const handleDeposit = async () => {
        Keyboard.dismiss();
        if (!depForm.accountNumber || !depForm.amount) {
            Alert.alert('Campos requeridos', 'Selecciona una cuenta e ingresa el monto.'); return;
        }
        const r = await onDeposit(depForm);
        if (r?.success) {
            setDepForm({ accountNumber: '', amount: '', currencyCode: 'GTQ', description: '' });
        }
    };

    const COLS = ['Nº Cuenta', 'Monto', 'Bal. Anterior', 'Bal. Nuevo', 'Descripción', 'Estado', 'Fecha'];

    return (
        <View style={{ flex: 1 }}>
            {/* Header fijo */}
            <View style={hist.header}>
                <TouchableOpacity onPress={() => onBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="arrow-back" size={22} color={C.primary} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={s.pageTitle}>Depósitos</Text>
                    <Text style={s.pageSub}>Historial de depósitos en tus cuentas</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={C.primary} />}>

                {/* Mensajes */}

                {/* Formulario */}
                <View style={[s.listCard, SHADOWS.sm, { marginBottom: SPACING.lg }]}>
                    <Text style={hist.formTitle}>Nuevo depósito</Text>
                    <LSelect label="Cuenta destino *" value={depForm.accountNumber}
                        options={accOpts} onSelect={v => setDep('accountNumber', v)} required />
                    <LInput label="Monto *" value={depForm.amount}
                        onChangeText={v => setDep('amount', v)} numeric required />
                    <LSelect label="Moneda" value={depForm.currencyCode}
                        options={coinOpts} onSelect={v => setDep('currencyCode', v)} />
                    {depForm.currencyCode && depForm.currencyCode !== 'GTQ' && depForm.amount ? (() => {
                        const sel = coinOpts.find(c => c.v === depForm.currencyCode);
                        const rate = sel?.rate ?? 1;
                        const converted = (+depForm.amount * rate).toFixed(2);
                        return (
                            <View style={{
                                backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, marginBottom: 8,
                                flexDirection: 'row', alignItems: 'center', gap: 8
                            }}>
                                <MaterialIcons name="info-outline" size={14} color={C.primaryMid} />
                                <Text style={{ flex: 1, fontSize: 12, color: C.primaryMid }}>
                                    {`${depForm.amount} ${depForm.currencyCode} ≈ Q ${converted} GTQ (tasa: ${rate})`}
                                </Text>
                            </View>
                        );
                    })() : null}
                    <LInput label="Descripción" value={depForm.description}
                        onChangeText={v => setDep('description', v)} placeholder="Motivo del depósito..." />
                    <View style={{ height: SPACING.md }} />
                    <PBtn title="Realizar depósito" icon="arrow-downward" onPress={handleDeposit} loading={submitting} />
                </View>

                {/* Tabla historial */}
                <View style={[hist.tableCard, SHADOWS.sm]}>
                    <View style={hist.tableTitle}>
                        <Text style={hist.tableTitleTxt}>Mis depósitos ({deposits.length})</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={true}
                        nestedScrollEnabled={true} scrollEventThrottle={16}
                        directionalLockEnabled={false} keyboardShouldPersistTaps="handled"
                        style={Platform.OS === 'web' ? { overflowX: 'auto', overflowY: 'visible' } : {}}>
                        <View>
                            {/* Encabezado */}
                            <View style={hist.thead}>
                                {COLS.map(h => <Text key={h} style={hist.th}>{h}</Text>)}
                            </View>
                            {/* Filas */}
                            {loading && !deposits.length
                                ? <View style={hist.loadingRow}><ActivityIndicator color={C.primary} /></View>
                                : deposits.length === 0
                                    ? <View style={hist.emptyRow}>
                                        <MaterialIcons name="arrow-downward" size={32} color={C.textMuted} />
                                        <Text style={hist.emptyTxt}>Sin depósitos registrados</Text>
                                    </View>
                                    : deposits.map((d, i) => {
                                        const isOk = !d.status || d.status === 'exitosa' || d.status === 'completada';
                                        return (
                                            <View key={d._id ?? i} style={[hist.tr, i % 2 === 1 && hist.trAlt]}>
                                                <Text style={[hist.td, hist.tdAcc, hist.colAcc]}>{d.accountNumber}</Text>
                                                <Text style={[hist.td, hist.tdAmount, hist.colMonto]}>{(() => {
                                                    const cur = d.currencyCode ?? 'GTQ';
                                                    const sym = { GTQ: 'Q', USD: '$', EUR: '€', GBP: '£' }[cur] ?? cur + ' ';
                                                    return sym + (d.amount ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                })()}</Text>
                                                <Text style={[hist.td, hist.colNum, { color: C.textSub }]}>{fmt(d.previousBalance)}</Text>
                                                <Text style={[hist.td, hist.colNum, { color: C.success, fontWeight: FONT_WEIGHT.semibold }]}>{fmt(d.newBalance)}</Text>
                                                <Text style={[hist.td, hist.colDesc]} numberOfLines={2}>{d.description ?? '—'}</Text>
                                                <View style={hist.colEstado}>
                                                    <View style={[hist.statusPill, { backgroundColor: isOk ? '#F0FDF4' : '#FEF2F2' }]}>
                                                        <Text style={[hist.statusTxt, { color: isOk ? C.success : C.error }]}>
                                                            {d.status ?? 'Exitosa'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={[hist.td, hist.colFecha, { color: C.textMuted }]}>
                                                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString('es-GT') : '—'}
                                                </Text>
                                            </View>
                                        );
                                    })
                            }
                        </View>
                    </ScrollView>
                </View>
            </ScrollView>
        </View>
    );
}