using Dosage.Application;
using Dosage.Domaine;
using Xunit;

namespace Dosage.Tests;

/// <summary>
/// US-1, déjà livrée : elle donne une base verte aux portes. Les stories suivantes ne le sont
/// pas — c'est là que /tdd et /skraft ont du travail.
/// </summary>
public class CalculDeBolusTests
{
    [Fact] // @ac-1
    public void Sous_le_plafond_la_dose_est_proposee_telle_quelle()
    {
        var p = new CalculDeBolus().Proposer(Unite.De(6), Plafond.De(Unite.De(10)));

        Assert.Equal(Unite.De(6), p.Dose);
        Assert.Null(p.Alerte);
    }

    [Fact] // @ac-2
    public void Au_dessus_du_plafond_la_dose_est_limitee_et_expliquee()
    {
        var p = new CalculDeBolus().Proposer(Unite.De(12.5m), Plafond.De(Unite.De(10)));

        Assert.Equal(Unite.De(10), p.Dose);
        Assert.Equal("Dose plafonnée à 10 U", p.Alerte);
    }

    [Fact] // @ac-3
    public void Sans_plafond_configure_le_calcul_passe_tel_quel()
    {
        var p = new CalculDeBolus().Proposer(Unite.De(12.5m), Plafond.Aucun);

        Assert.Equal(Unite.De(12.5m), p.Dose);
        Assert.Null(p.Alerte);
    }

    [Fact]
    public void Une_dose_negative_n_existe_pas()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Unite.De(-1));
    }
}
