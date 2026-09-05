<div align="center">

# Mond Pricing

Calculadora de orçamentos para definir quanto cobrar por cada projeto com mais consistência.

[**Abrir projeto**](https://calculadora-de-orcamentos-mond.vercel.app/)

</div>

![Prévia preenchida do Mond Pricing](./public/readme-preview.jpg)

## Sobre

O Mond Pricing ajuda a montar um valor de cobrança com base no trabalho real da demanda. Você escolhe o tipo de projeto, informa o tempo previsto, define contexto, custos e sua base de preço. A ferramenta calcula uma faixa para você decidir quanto cobrar sem depender de chute.

A calculadora também permite trabalhar com três estratégias de preço: **Captação**, **Equilibrado** e **Posicionado**.

## O que entra no cálculo

- tipo de projeto e modelo de trabalho;
- horas de execução, reuniões, suporte e revisões;
- complexidade, escopo e urgência;
- meta mensal, custos fixos e horas faturáveis;
- despesas específicas da demanda;
- impostos, taxas, margem e desconto;
- deslocamento por distância e tempo.

O resultado mostra **piso**, **valor recomendado** e **faixa premium**, além de entrada, saldo na entrega, horas totais, margem estimada e alertas de preço.

## Dados

Nesta versão, a base de preço e os orçamentos salvos usam `localStorage`. Os dados permanecem somente no navegador e no dispositivo em que foram criados.

## Stack

`React 19` · `TypeScript` · `TanStack Start` · `Vite` · `Vercel`

## Desenvolvimento

```bash
npm install
npm run dev
```

Para validar e gerar a versão de produção:

```bash
npm run check
npm run build
```

<div align="center">
  <sub>Mond Pricing</sub>
</div>
