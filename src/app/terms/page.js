import {
  LEGAL_CONTACT_EMAIL,
  LegalDocument,
  LegalSection,
} from '@/components/LegalDocument';

export const metadata = {
  title: 'Termos de uso e serviço · AchadosTopBr',
  description:
    'O AchadosTopBr é um mostruário de ofertas de afiliado. O site não vende produtos nem cobra do visitante.',
};

export default function TermsPage() {
  return (
    <LegalDocument title="Termos de uso e serviço">
      <LegalSection title="O que é este site">
        <p>
          O AchadosTopBr é um mostruário de ofertas. As páginas públicas mostram produtos de
          lojas parceiras, com link para a página de compra de cada loja. Não há cadastro, login
          nem área do cliente para quem visita o catálogo.
        </p>
        <p>
          Usar a vitrine significa aceitar estes termos. Se não concordar, basta não usar o site.
        </p>
      </LegalSection>

      <LegalSection title="Não somos uma loja">
        <p>
          Não vendemos, não cobramos e não entregamos os produtos exibidos. O contrato de compra,
          o pagamento, a nota, a troca e a entrega são feitos direto com a loja de destino, como
          Mercado Livre, Shopee, Amazon ou Magalu.
        </p>
        <p>
          Preço, estoque, frete, cupom e prazo mostrados na vitrine podem mudar na loja sem aviso
          prévio. A informação que vale é a da página da loja no momento da compra.
        </p>
        <p>
          Os links de compra são de afiliado. A loja pode pagar uma comissão se a compra se
          confirmar. Isso não aumenta o preço para quem compra e não cria relação de consumo entre
          o visitante e o AchadosTopBr.
        </p>
      </LegalSection>

      <LegalSection title="Grupos de WhatsApp">
        <p>
          Os botões de grupo levam ao WhatsApp. A participação no grupo segue as regras do
          WhatsApp e as regras de convivência informadas no próprio grupo. Mensagens enviadas lá
          não são um pedido de compra feito neste site.
        </p>
      </LegalSection>

      <LegalSection title="Comentários no Instagram">
        <p>
          Em algumas publicações, um comentário pedindo o link (por exemplo, “QUERO”) pode receber
          uma resposta privada no Direct com o endereço da oferta. A resposta é única, automática
          e limitada a esse pedido. Ignorar ou apagar a mensagem encerra o contato.
        </p>
      </LegalSection>

      <LegalSection title="Uso aceitável">
        <p>
          É permitido consultar as ofertas e abrir os links. Não é permitido usar o site para
          fraude, sobrecarregar a infraestrutura, copiar a base de ofertas de forma automatizada
          para revenda nem se passar pelo AchadosTopBr.
        </p>
      </LegalSection>

      <LegalSection title="Propriedade intelectual">
        <p>
          A marca, o logotipo e o texto de apresentação do AchadosTopBr pertencem à operação do
          site. Fotos, nomes e preços dos produtos pertencem às lojas e aos fabricantes. As marcas
          das lojas citadas pertencem aos respectivos titulares.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilidade">
        <p>
          A vitrine é oferecida como está. Não garantimos que uma oferta continue disponível, que
          o preço permaneça o mesmo, nem que a loja conclua a venda. Também não respondemos por
          indisponibilidade de Instagram, WhatsApp ou das lojas.
        </p>
        <p>
          Nada nestes termos afasta direito do consumidor que a lei brasileira não permita afastar
          na relação direta com a loja onde a compra for feita.
        </p>
      </LegalSection>

      <LegalSection title="Contato e alterações">
        <p>
          Dúvidas sobre estes termos:{' '}
          <a className="underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          . A privacidade do visitante e dos comentários no Instagram está na Política de
          Privacidade.
        </p>
        <p>
          Podemos atualizar estes termos. A data no topo da página indica a versão vigente. Estes
          termos são regidos pelas leis da República Federativa do Brasil.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
