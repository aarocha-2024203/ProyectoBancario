// src/features/client/loans/screens/LoansScreen.jsx
import React from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, fmt, SPACING, FONT_SIZE, FONT_WEIGHT } from '../../components/clientTheme.js';

export default function LoansScreen({ loans, loading, onRefresh }) {
    // Colores por estado
    const statusStyle = {
        solicitado: { bdr: '#FCD34D', bg: '#FFFBEB', txt: '#92400E' },
        aprobado: { bdr: '#6EE7B7', bg: '#ECFDF5', txt: '#065F46' },
        rechazado: { bdr: '#FCA5A5', bg: '#FFF5F5', txt: '#991B1B' },
        desembolsado: { bdr: '#C4B5FD', bg: '#F5F3FF', txt: '#5B21B6' },
        pagado: { bdr: '#A7F3D0', bg: '#ECFDF5', txt: '#059669' },
        vencido: { bdr: '#D1D5DB', bg: '#F9FAFB', txt: '#374151' },
    };

    const fmtD = d => d ? new Date(d).toLocaleDateString('es-GT',
        { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xxl }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh}
                tintColor={C.primary} />}>
            <Text style={s.pageTitle}>Mis Préstamos</Text>
            <Text style={s.pageSub}>{loans.length} préstamo{loans.length !== 1 ? 's' : ''}</Text>

            {loans.length === 0 ? (
                <View style={s.emptyCard}>
                    <MaterialIcons name="attach-money" size={44} color={C.textMuted} />
                    <Text style={s.emptyTxt}>Sin préstamos registrados</Text>
                    <Text style={s.emptySub}>Los préstamos son asignados por el administrador</Text>
                </View>
            ) : loans.map((l, i) => {
                const st = l.status ?? 'solicitado';
                const sc = statusStyle[st] ?? statusStyle.solicitado;
                const amt = +(l.approvedAmount ?? l.requestedAmount ?? 0);
                return (
                    <View key={l._id ?? l.id ?? i} style={{
                        backgroundColor: C.surface, borderRadius: 14, marginBottom: SPACING.md,
                        borderWidth: 2, borderColor: sc.bdr, overflow: 'hidden'
                    }}>
                        {/* Header con color del estado */}
                        <View style={{
                            backgroundColor: sc.bg, padding: SPACING.md,
                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
                                    {l.accountNumber}
                                </Text>
                                <Text style={{ fontSize: FONT_SIZE.xs, color: C.textSub, marginTop: 2 }}>
                                    {l.loanPurpose || 'Préstamo bancario'}
                                </Text>
                            </View>
                            <View style={{
                                backgroundColor: sc.bdr, borderRadius: 99,
                                paddingHorizontal: 10, paddingVertical: 4
                            }}>
                                <Text style={{
                                    fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: sc.txt,
                                    textTransform: 'uppercase'
                                }}>
                                    {st}
                                </Text>
                            </View>
                        </View>

                        {/* Monto */}
                        <View style={{ padding: SPACING.md }}>
                            <Text style={{ fontSize: 10, color: C.textMuted, marginBottom: 4 }}>MONTO APROBADO</Text>
                            <Text style={{ fontSize: 22, fontWeight: FONT_WEIGHT.bold, color: C.primary }}>
                                {fmt(amt)}
                            </Text>
                        </View>

                        <View style={{ height: 1, backgroundColor: C.border }} />

                        {/* Detalles */}
                        <View style={{ padding: SPACING.md, gap: 8 }}>
                            {[
                                { l: 'Solicitado', v: fmt(l.requestedAmount ?? 0) },
                                { l: 'Tasa', v: `${l.interestRate ?? 0}% anual` },
                                { l: 'Plazo', v: `${l.termMonths ?? 0} meses` },
                                { l: 'Cuota', v: fmt(l.monthlyPayment ?? 0) },
                                { l: 'F. solicitud', v: fmtD(l.requestDate) },
                            ].map((row, j) => (
                                <View key={j} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 11, color: C.textSub }}>{row.l}</Text>
                                    <Text style={{ fontSize: 11, fontWeight: FONT_WEIGHT.semibold, color: C.text }}>
                                        {row.v}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
}

