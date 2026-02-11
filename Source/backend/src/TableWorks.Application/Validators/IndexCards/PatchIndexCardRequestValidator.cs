using FluentValidation;
using TableWorks.Application.DTOs.IndexCards;

namespace TableWorks.Application.Validators.IndexCards;

public sealed class PatchIndexCardRequestValidator : AbstractValidator<PatchIndexCardRequest>
{
    public PatchIndexCardRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.")
            .When(x => x.PatchTitle);

        RuleFor(x => x.Content)
            .MaximumLength(10000).WithMessage("Content must not exceed 10000 characters.")
            .When(x => x.Content is not null);

        RuleFor(x => x.Color)
            .MaximumLength(20).WithMessage("Color must not exceed 20 characters.")
            .When(x => x.Color is not null);
    }
}
