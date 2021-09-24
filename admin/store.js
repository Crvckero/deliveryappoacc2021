
module.exports = {
    APLICATIVO: "(SELECT id_aplicativo FROM " + _STORE_ + ".cliente_aplicativo WHERE id_cliente = ? AND activo = 1)",

    AGENCIA: "(SELECT id_agencia FROM " + _STORE_ + ".cliente_agencia WHERE id_cliente = ? AND activo = 1)",
    AGENCIA_POR_SUCURSAL: "(SELECT id_agencia FROM " + _STORE_ + ".cliente_sucursal WHERE id_cliente = ? AND activo = 1)",

    SUCURSAL: "(SELECT id_sucursal FROM " + _STORE_ + ".cliente_sucursal WHERE id_cliente = ? AND activo = 1)",
    SUCURSAL_POR_AGENCIA: "(SELECT s.id_sucursal FROM " + _STORE_ + ".cliente_agencia ca INNER JOIN " + _STORE_ + ".sucursal s ON ca.id_agencia = s.id_agencia WHERE ca.id_cliente = ? AND ca.activo = 1)",
}