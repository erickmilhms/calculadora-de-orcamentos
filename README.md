<div align="center">

# Mond Pricing

Uma calculadora de orçamentos para transformar tempo, contexto e custos em um valor de cobrança mais consistente.

[**Abrir projeto**](https://calculadora-de-orcamentos-mond.vercel.app/)

</div>

![Prévia do Mond Pricing](https://image.thum.io/get/width/1600/crop/900/noanimate/https://calculadora-de-orcamentos-pi.vercel.app/)

## Sobre

O Mond Pricing foi feito para evitar orçamento no improviso. Você informa como é a demanda, o tempo estimado, o nível de complexidade, urgência, custos e sua base de preço. A ferramenta cruza essas informações e entrega uma faixa de cobrança para a decisão final continuar sendo sua.

A interface também separa a estratégia comercial em três modos: **Captação**, **Equilibrado** e **Posicionado**.

## O que entra no cálculo

- tipo de projeto e modelo de trabalho;
- horas de execução, reuniões, suporte e revisões;
- complexidade, escopo e urgência;
- meta mensal, custos fixos e horas faturáveis;
- despesas específicas da demanda;
- impostos, taxas, margem e desconto;
- deslocamento por distância e tempo.

O resultado apresenta **piso**, **valor recomendado** e **faixa premium**, além de entrada, saldo na entrega, horas totais, margem estimada e alertas de preço.

## Dados

Não existe banco de dados nesta versão. A base de preço e os orçamentos salvos usam `localStorage`, então ficam armazenados somente no navegador e dispositivo em que foram criados.

## Stack

`React 19` · `TypeScript` · `TanStack Start` · `Vite` · `Tailwind CSS` · `Vercel`

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

---

<div align="center">
  <sub>Mond Pricing · ferramenta interna para precificação de projetos</sub>
</div>
