import {
  LEGAL_CONTACT_EMAIL,
  LegalDocument,
  LegalSection,
} from '@/components/LegalDocument';

export const metadata = {
  title: 'Política de Privacidade · AchadosTopBr',
  description:
    'A vitrine AchadosTopBr é um mostruário de ofertas. Não há cadastro nem captação de dados do visitante.',
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument title="Política de Privacidade">
      <LegalSection title="Quem somos">
        <p>
          O AchadosTopBr (“nós”) publica um mostruário de ofertas de afiliado em{' '}
          <a className="underline" href="https://www.achadostopbr.com.br">
            https://www.achadostopbr.com.br
          </a>
          . Esta política explica o que acontece com as informações de quem visita a vitrine e de
          quem comenta nas publicações do Instagram da marca.
        </p>
        <p>
          Contato:{' '}
          <a className="underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="A vitrine não coleta dados do visitante">
        <p>
          O catálogo é só um mostruário. Não há conta, login, cadastro, newsletter, formulário nem
          checkout no site. Não pedimos nome, e-mail, telefone, documento ou endereço de quem
          apenas navega nas ofertas.
        </p>
        <p>
          A busca de ofertas filtra a lista no próprio navegador. O texto digitado não é enviado
          para montar um perfil.
        </p>
        <p>
          A escolha de tema claro ou escuro fica gravada apenas no aparelho, na memória local do
          navegador (<span className="font-medium">localStorage</span>). Não sai do dispositivo e
          não identifica a pessoa.
        </p>
        <p>Não vendemos dados e não usamos a visita à vitrine para publicidade comportamental.</p>
      </LegalSection>

      <LegalSection title="Links para lojas e WhatsApp">
        <p>
          “Comprar” abre o link de afiliado na loja de destino, como Mercado Livre, Shopee, Amazon
          ou Magalu. “Entrar no grupo” abre o WhatsApp. A partir daí, a navegação segue as regras
          desses serviços. Não recebemos o conteúdo da compra nem as mensagens do grupo.
        </p>
      </LegalSection>

      <LegalSection title="Comentários no Instagram">
        <p>
          A app Achados Top Br API, ligada à conta profissional do Instagram da marca, recebe da
          Meta um aviso quando alguém comenta em uma publicação. O aviso pode incluir o texto do
          comentário, o identificador do comentário, o identificador do perfil no Instagram e o
          identificador da publicação.
        </p>
        <p>
          Usamos esses dados somente para responder em particular, no Direct, com o link da oferta
          quando o comentário pede o link (por exemplo, “QUERO”), e para não enviar a mesma
          resposta duas vezes. Guardamos o identificador do comentário, o identificador do perfil,
          o texto, a data e o resultado do envio apenas para esse controle.
        </p>
        <p>
          Não usamos esses dados para anúncio, venda, enriquecimento de cadastro ou perfil de
          marketing. Não pedimos senha do Instagram e não publicamos em nome de quem comentou.
        </p>
      </LegalSection>

      <LegalSection title="Painel do operador">
        <p>
          Quem administra as ofertas entra no painel interno com a sessão do WhatsApp da própria
          operação. Isso não é um cadastro de visitantes da vitrine. Os dados desse acesso ficam
          restritos à operação do AchadosTopBr.
        </p>
      </LegalSection>

      <LegalSection title="Com quem compartilhamos">
        <p>
          Prestadores que hospedam o site e o banco de dados tratam as informações técnicas
          necessárias para o serviço funcionar, sob orientação nossa. A Meta trata os dados do
          Instagram segundo as regras da própria plataforma. Lojas e WhatsApp só entram em cena
          quando a pessoa clica e sai do site.
        </p>
      </LegalSection>

      <LegalSection title="Por quanto tempo">
        <p>
          O registro do comentário usado para enviar o link permanece pelo tempo necessário para
          evitar respostas duplicadas e para atender um pedido de exclusão. A preferência de tema
          permanece no navegador até a pessoa apagá-la.
        </p>
      </LegalSection>

      <LegalSection id="exclusao-de-dados" title="Exclusão de dados">
        <p>
          Quem comentou em uma publicação e quiser apagar o registro desse comentário pode pedir
          pelo e-mail{' '}
          <a className="underline" href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
            {LEGAL_CONTACT_EMAIL}
          </a>
          . Informe o nome de usuário do Instagram e, se possível, o link da publicação. Apagamos o
          registro ligado a esse comentário, salvo o que a lei obrigar a conservar.
        </p>
        <p>
          A visita à vitrine não gera cadastro para excluir. A preferência de tema pode ser
          removida limpando os dados do site no navegador.
        </p>
      </LegalSection>

      <LegalSection title="Alterações">
        <p>
          Se esta política mudar, a data no topo da página é atualizada. O uso contínuo da vitrine
          depois da mudança vale como leitura da versão nova.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
