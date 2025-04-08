const getTicketForms = () => {
  return {
    promotion: {
      id: 27679416279323,
      tags: ["tipo_promocion", "portal"],
    },
    test: {
      id: 35689142494107,
      tags: [],
    },
  };
};

const getFields = () => {
  return {
    SubAsunto: {
      id: 31386061455515,
    },
    Tienda: {
      id: 24020021733787,
      value: "Tienda",
      possiblevalues: [
        "whitelabel_portal",
        "marketplace_portal",
        "todas_portal",
        "crocs_wl_co_portal",
      ], // simple
    },
    Países: {
      id: 24019769142299,
      value: "country",
      possiblevalues: ["co_portal", "cl_portal", "pe_portal"], // multi
    },
    Marcas: {
      id: 24019332736923,
      value: "brand",
      possiblevalues: ["xiaomi_portal", "crocs_portal"],
    },
    Partner: {
      //
      id: 24019248086171,
      value: "partner",
      possiblevalues: ["intcomex_portal", "ixcomercio_portal", "bmg_portal"], // simple
    },
    Interno: {
      id: 24286061103643,
      value: "partner",
      possiblevalues: ["interno_portal", "externo_portal"], // simple
    },
    channel: {
      id: 24263069147419,
      value: "Canal",
      possiblevalues: ["wl_portal", "mk_portal", "ph_portal"], // simple
    },
    Channels: {
      id: 25595792953115,
      value: "Canales",
      possiblevalues: ["wl_cls_portal", "mk_cls_portal", "ph_cls_portal"], // multi
    },
    ImageUrl: {
      id: 24020399637531,
      value: "Some Link",
    },
    Subtipo: {
      id: 24264624936219,
      value: "Subtipo",
      possiblevalues: [
        "reposición_de_inventario_directo_a_tienda",
        "traslado_entre_tiendas",
        "reposición_de_inventario_de_almacén_a_tiendas",
        "solicitud_de_importación",
      ], // multi
    },
    ModalidadEnvio: {
      id: 24265050367899,
      value: "Modalidad de envio",
      possiblevalues: ["aéreo", "terrestre", "marítimo"], // multi
    },
    UpdateData: {
      id: 25210576894747,
      value: "data",
      possiblevalues: ["basico_portal", "ficha_portal", "imagenes_portal"], // multi
    },
    TipoPublicacion: {
      id: 25470662460059,
      possiblevalues: [
        "portal_publicacion",
        "portal_modificacion",
        "portal_despublicacion",
      ], // simple
    },
    // PROMOCIONES
    IdentificadorDeLaPromocion: {
      id: 27679356223131,
      value: "Identificador de la promoción",
    }, // PROD
    TiendasARetirar: {
      id: 27679447764123,
      value: "Tiendas a retirar",
      possiblevalues: ["Tienda"], // multilinea
    }, // PROD
    NombreDeLaPromocion: {
      id: 27679569250459,
      value: "Nombre de la promoción",
    }, // PROD -
    TipoPromocion: {
      id: 24264037317019,
      value: "Tipo de promoción",
      possiblevalues: [
        "creación_portal",
        "modificación_portal",
        "creación_-_tienda",
        "modificación_-_tienda",
      ], // multi
    }, // PROD
    SubtipoPromocionTienda: {
      id: 24263625359259,
      value: "Subtipo de promoción en tienda",
      possiblevalues: [
        "descuento_fijo_bmg_portal",
        "compre_x_lleve_y_bmg_portal",
        "descuento_m_n_bmg_portal",
        "escala_descuento_bmg_portal",
        "compra_x_lleva_y_categoria_bmg_portal",
        "descuento_tienda_bmg_portal",
      ], // multi
    }, // PROD
    FechaInicio: {
      id: 24263232918555,
      value: "Fecha de inicio",
      possiblevalues: ["yyyy-mm-dd"],
    }, // PROD
    FechaFin: {
      id: 24263269848091,
      value: "Fecha de fin",
      possiblevalues: ["yyyy-mm-dd"],
    }, // PROD
    IndividualUPC: {
      id: 27680028847771,
      value: "209642-6AD8,209642-6AD8",
    }, // PROD
    TipoDeProductoARetirar: {
      id: 27680053479451,
      possiblevalues: ["masivo", "individual"],
    }, // PROD
    DescripcionPromocion: {
      id: 27680158673947,
      value: "Descripcion de la promocion",
    }, // PROD

    SubtipoModificacionPromocion: {
      id: 24263573455899,
      value: "Subtipo de modificación de promoción",
      possiblevalues: ["retiro_de_producto", "cambio_de_categorías"],
    }, // PROD                ,
    TipoPrecio: {
      id: 28266561856027,
      value: "Tipo de Precio",
      possiblevalues: ["portal_precio_base", "portal_precio_oferta"],
    }, // PROD
    TipoIva: {
      id: 28266618284059,
      value: "Tipo de IVA",
      possiblevalues: ["portal_con_iva", "portal_sin_iva"],
    },
    // PROD
    // Operaciones tiendas fisicas - PROD
    // FINANZAS
    TiendasOperaciones: {
      id: 29104953234459,
      value: "Tiendas seleccionadas",
    },
    TiendasDeFinanzas: {
      id: 29104936399515,
      value: "Tipo de solicitud de finanzas",
      possiblevalues: ["auditoría_de_p_l"],
    },
    FinazasFechaInicio: {
      id: 29105001632411,
      value: "Fecha de inicio de finanzas",
    },
    FinanzasFechaFinal: {
      id: 29104996593307,
      value: "Fecha de final de finanzas",
    },
    Rubro: {
      id: 29105087425691,
      value: "Rubro de finanzas",
      possiblevalues: ["ventas_finanzas", "costos_finanzas", "gastos_finanzas"],
    },
    // Operaciones tiendas fisicas
    TipoDeOperaciones: {
      id: 29125803719579,
      possiblevalues: [
        "reporte_nuevo_/_adicionales",
        "solicitud_de_suministros_adicionales",
        "remodelación_o_mejora_de_tienda",
      ],
    },
    DescripcionReporteOperaciones: {
      id: 29125773386267,
      value: "Descripcion del reporte de tiendas fisicas",
    },
    TipoDeReportes: {
      id: 29125851037595,
      possiblevalues: ["único_reporte", "reporte_con_frecuencia"],
    },
    Frecuencia: {
      id: 29125852666779,
      value: "Tipo de frecuencias.",
    },
    LinkText: {
      id: 30699300151579,
    },
    TipoDeOperacionesPOP: {
      id: 31737638483867,
    },
    // RRHH
    TipoDeRecursosHumanos: {
      id: 27873297663899,
      possiblevalues: [
        "contratación_de_personal_adicional",
        "implementación_de_incentivos",
        "cambios_en_uniforme_de_trabajo",
        "solicitud_de_capacitación_adicional_/_evento_de_marca",
      ],
    },
    CargoRecursosHumanos: {
      id: 27873366426651,
      possiblevalues: [
        "asesores_de_tienda_rrhh",
        "gerente_de_tienda_rrhh",
        "backoffice_rrhh",
        "otro_rrhh",
      ],
    },
    NuevoCargo: {
      id: 27873477835675,
      value: "Nuevo Cargo seleccionado",
    },
    TipoDeContratacion: {
      id: 27873965852059,
      possiblevalues: [
        "persona_referida_rrhh",
        "proceso_reclutamiento__ixcomercio_rrhh",
      ],
    },
    DescripcionCargo: {
      id: 27873371053723,
      value: "Descripciones de los cargos seleccionados",
    },
    AdjuntarHojaVida: {
      id: 27873991776667,
      value: "Hoja de vida",
    },
    NombreContacto: {
      id: 27873510066843,
      value: "Nombre de contacto",
    },
    EmailContacto: {
      id: 27873525668507,
      value: "Correo de contact",
    },
    RolContactos: {
      id: 27873532677019,
      value: "Rol de los contactos",
    },
    // Operaciones digitales
    MarketPlace: {
      id: 29973498641051,
      value: "Market place",
      possiblevalues: ["mercado_libre_portal", "falabella_portal"],
    },
    SubtipoFulfillment: {
      id: 29973572787099,
      possiblevalues: [
        "reposición_en_fulfillment_by",
        "nuevo_servicio_fulfillment_by",
        "retiro_producto_fulfillment_by",
      ],
    },
    DescriptionFulFillment: {
      id: 29973560253467,
    },
    tipodeNuevasNecesidades: {
      id: 31290093765019,
    },
    // Servicio al cliente
    SubtipoReporte: {
      id: 30342863672603,
      possiblevalues: [
        "reporte_tiempos_de_gestión_portal",
        "reporte_nivel_de_servicio_portal",
        "reporte_de_cierre_de_casos_portal",
        "estados_de_casos_abiertos_de_servicios_portal",
      ],
    },
    Estado: {
      id: 26853576506907,
      possiblevalues: ["aprobado_portal", "rechazado_portal"],
    },
    // Ultima MIlla - Formulario de Reportes de Ordenes
    TypeLastMille: {
      id: 29973871153051,
      possiblevalues: [
        "reporte_de_entrega_de_ordenes",
        "activar_/_desactivar_tipo_de_servicio_habilitados",
        "formulario_de_reporte_de_ordenes",
      ],
    },
    SubtipoReporteOrdenes: {
      id: 29974005547547,
      possiblevalues: [
        "reporte_de_cobro_de_envío_free_shipping_portal",
        "reporte_de_ultima_milla_y_niveles_de_servicio_portal",
      ],
    },
    // Ultima Milla - Activacion o Desactivacion de servicio de entrega
    ActiveOrDesactive: {
      id: 29973926611355,
      possiblevalues: ["activar_portal", "desactivar_portal"],
    },
    TypeShippingService: {
      id: 29973966674715,
      possiblevalues: ["same_day", "next_day", "estandar"],
    },
    // Pagos
    PaymentsTypeForm: {
      id: 25603172528155,
      possibleValues: [
        "evolutivos_portal",
        "operación_del_día_a_día_portal",
        "solicitud_de_reportes_portal",
      ],
    },
    RejectionField: {
      id: 30276778487835,
      possibleValues: [
        "problema_de_la_pasarela_portal",
        "problemas_de_medios_de_pago_portal",
        "ambos_portal",
      ],
    },
    // Pagos - Evolutivos
    EvolvingPayments: {
      id: 30276388737819,
      possibleValues: [
        "nuevas_pasarelas_de_pago_portal",
        "nuevos_medios_de_pago_portal",
      ],
    },
    // Pagos - Operaciones
    OperationsPayments: {
      id: 26177147187867,
      possibleValues: [
        "activar/desactivar_medio_de_pago_portal",
        "activar/desactivar_pasarela_de_pago_portal",
        "ncluir_en_lista_blancas_clientes_conocidos_portal",
        "validar_motivos_de_rechazo_portal",
      ],
    },
    // Pagos - Metodos
    PaymentMethods: {
      id: 30278641929755,
    },
    // Pagos - Pasarelas
    PaymentsGateways: {
      id: 30276691658395,
    },
    // Pagos - Activar o desactivar metodos de pagos
    StatusPayments: {
      id: 29973926611355,
      possibleValues: ["activar_portal", "desactivar_portal"],
    },
    // Pagos - Problemas pagos
    PaymentGatewaysProblems: {
      id: 30277163203099,
      possibleValues: [
        "problema_técnico_portal",
        "poblema_tasa_de_aprobación/rechazo_portal",
      ],
    },
    TypeGatewaysProblems: {
      id: 30276778487835,
      possibleValues: [
        "problema_de_la_pasarela_portal",
        "problemas_de_medios_de_pago_portal",
        "ambos_portal",
      ],
    },
    // ------------------------------------------------------------------------------------------------//
    //Promociones Digitales
    //  ---    Promociones Digitales  Promocion de catálogo -----//
    TipoPromocionCatalogo: {
      id: 30164823240987,
      possibleValues: ["cupon_de_descuento_portal", "compra_x_lleve_y_portal"],
    },
    SubtipoPromocion: {
      id: 30164874701723,
      possibleValues: ["por_porcentaje_portal", "valor_fijo_portal"],
    },
    PorcentajeDescuento: {
      id: 30164895752859,
      possibleValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    ValorDescuento: {
      id: 30164897039259,
      possibleValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    TipoCupon: {
      id: 30164968778523,
      possibleValues: [
        "aplica_a_toda_la_tienda_portal",
        "único_por_usuario_portal",
        "sin_cupón_se_aplica_en_carro_automáticamente_portal",
      ],
    },
    NombreCupones: {
      id: 30164993560987,
      possibleValues: ["text"],
    },
    NumeroCupones: {
      id: 30165015034267,
      possibleValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    NumeroRedenciones: {
      id: 30165025276443,
      possibleValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    AplicaPara: {
      // PC, MP
      id: 30165046252315,
      possibleValues: [
        "sku_específico_portal",
        "listado_de_skus_portal",
        "toda_la_tienda_portal",
      ],
    },
    ListadoSkus: {
      // PC, MP
      id: 30180159115035,
      possibleValues: ["listado_manual_portal", "adjunta_una_lista_portal"],
    },
    ListadoSkus2: {
      // PC, MP , PE
      id: 30165099342619,
      possibleValues: ["text"],
    },
    ProductosEnPromocion: {
      id: 30165070455451,
      possibleValues: ["text"],
    },
    MarketingCanales: {
      // PC, MP, OP
      id: 30165268057755,
      possibleValues: [
        "campaña_email_portal",
        "campaña_google_portal",
        "campaña_facebook_portal",
      ], //multi
    },
    MarketingWhitelabel: {
      // PC, MP, OP
      id: 30165503894555,
      possibleValues: [
        "campaña_email_portal",
        "campaña_google_portal",
        "campaña_facebook_portal",
      ], //multi
    },
    //  ---    Promociones Digitales  Promocion de medios de pago -----//
    TipoPromocionMedioPago: {
      id: 30179621897243,
      possibleValues: [
        "descuento_por_bines_portal",
        "promoción_de_tasa_de_interés_0__banco_seleccionado_portal",
      ],
    },
    NombreCampaña: {
      // MP, OP
      id: 30164833312667,
      possibleValues: ["text"],
    },
    Bancos: {
      id: 30179608940955,
      possibleValues: ["text"],
    },
    NumeroDeCuotas: {
      id: 32791192394011,
      possibleValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    },
    BinesSobrePromocion: {
      id: 30179598265755,
      possibleValues: ["text"],
    },
    //  ---    Promociones Digitales  Promocion de envío -----//
    TipoPromocionEnvio: {
      id: 30179598265755,
      possibleValues: ["text"],
    },
    SubtipoPromocionEnvio: {
      id: 30179686231707,
      possibleValues: [
        "toda_la_tienda_portall",
        "aplica_sku_específicos_portal",
        "segmentación_geográfica_portal",
      ],
    },
    SegmentacionGeografica: {
      id: 30179791394971,
      possibleValues: ["text"],
    },
    RegionODepartamento: {
      id: 30179794749723,
      possibleValues: ["text"],
    },
    DescuentoValorEnvio: {
      id: 30180536028443,
      possibleValues: ["text"],
    },
    //  ---    Promociones Digitales  Otras Promociones -----//
    TipoOtrasPromociones: {
      id: 30179803850267,
      possibleValues: ["otras_promociones_portal"],
    },
    IsMarketing: {
      id: 31115851632923,
      possibleValues: [true, false],
    },

    //  ---    Solicitudes y soporte -----//

    TipoSolicitud: {
      id: 28014879582491,
      //possibleValues: 'solicitud_de_usuario_portal', 'nuevas_funcionalidades_portal', 'errores_de_funcionalidades_portal', 'alistamiento_de_marca_en_portal_portal', //tagger - texto
    },
    Requerimiento: {
      id: 33043338829851,
      possibleValues: [
        "nuevo_país_portal",
        "nueva_marca_portal",
        "nueva_tienda_portal",
      ], //multiselect
    },
    CargarUsuarios: {
      id: 33043476080795,
      //possibleValues: "de_forma_masiva_portal", "de_forma_manual_portal" //tagger
    },
    SeccionImpactada: {
      id: 33043627769371,
      //possibleValues:  //text
    },
    AreaImpactada: {
      id: 33043589315739,
      //possibleValues:  //text
    },
    Prioridad: {
      id: 28014942320539,
      //posibleValues: "urgente_portal", "alta_portal", "medio_portal", "baja_portal" //tagger
    },
    ImpactoNegocio: {
      id: 33043642255131,
      //possibleValues:  //text
    },
  };
};

module.exports = {
  getTicketForms,
  getFields,
};
